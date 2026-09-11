import { strict as assert } from "assert";
import {
  RateLimiter,
  GeocodingCache,
  normalizeQueryKey,
  normalizeCoordKey,
  NominatimProvider,
  PhotonProvider,
  CompositeProvider,
  ProxyProvider,
  type PlaceResult,
  type GeocoderProvider,
} from "../client/src/lib/geocoding";
import { serverGeocoding } from "../server/geocoding";

console.log("=================================================");
console.log("  FREEGEOTAGGER PHASE 7 GEOCODER VERIFICATION    ");
console.log("=================================================\n");

let passedCount = 0;
let failedCount = 0;

function runTest(name: string, fn: () => void | Promise<void>) {
  return Promise.resolve()
    .then(() => fn())
    .then(() => {
      console.log(`  [PASS] ${name}`);
      passedCount++;
    })
    .catch((err) => {
      console.error(`  [FAIL] ${name}`);
      console.error(`         Error: ${err.message}`);
      failedCount++;
    });
}

async function runAllTests() {
  // Test 1: RateLimiter spacing
  await runTest("RateLimiter enforces minimum interval spacing between queued executions", async () => {
    const limiter = new RateLimiter(50); // 50ms for test
    const timestamps: number[] = [];

    const p1 = limiter.schedule(async () => {
      timestamps.push(Date.now());
      return 1;
    });
    const p2 = limiter.schedule(async () => {
      timestamps.push(Date.now());
      return 2;
    });
    const p3 = limiter.schedule(async () => {
      timestamps.push(Date.now());
      return 3;
    });

    const results = await Promise.all([p1, p2, p3]);
    assert.deepEqual(results, [1, 2, 3]);
    assert.equal(timestamps.length, 3);
    assert.ok(timestamps[1] - timestamps[0] >= 40, `Interval 1-2 was ${timestamps[1] - timestamps[0]}ms`);
    assert.ok(timestamps[2] - timestamps[1] >= 40, `Interval 2-3 was ${timestamps[2] - timestamps[1]}ms`);
  });

  // Test 2: GeocodingCache query normalization and LRU eviction
  await runTest("GeocodingCache normalizes queries and respects LRU capacity limits", () => {
    const cache = new GeocodingCache(3);

    // Normalization
    assert.equal(normalizeQueryKey("  New   York  "), "new york");
    assert.equal(normalizeCoordKey(40.71278, -74.00594), "rev:40.7128,-74.0059");

    // Cache hit on normalized query
    const dummyResult: PlaceResult[] = [
      { lat: 40.7128, lng: -74.006, displayName: "New York, USA" },
    ];
    cache.setQuery("New York", dummyResult);
    assert.deepEqual(cache.getQuery("   new   york  "), dummyResult);

    // LRU eviction test (capacity = 3)
    cache.setQuery("Paris", [{ lat: 48.8566, lng: 2.3522, displayName: "Paris" }]);
    cache.setQuery("London", [{ lat: 51.5074, lng: -0.1278, displayName: "London" }]);
    assert.equal(cache.size, 3);

    // Access New York to make it most recent, then add Tokyo -> Paris should be evicted
    cache.getQuery("New York");
    cache.setQuery("Tokyo", [{ lat: 35.6762, lng: 139.6503, displayName: "Tokyo" }]);
    assert.equal(cache.size, 3);
    assert.ok(cache.getQuery("New York") !== undefined, "New York should remain");
    assert.ok(cache.getQuery("Tokyo") !== undefined, "Tokyo should exist");
    assert.ok(cache.getQuery("Paris") === undefined, "Paris should have been evicted as oldest");
  });

  // Test 3: GeocodingCache coordinate proximity rounding
  await runTest("GeocodingCache groups nearby reverse geocoding lookups within ~11m", () => {
    const cache = new GeocodingCache(10);
    const place: PlaceResult = { lat: 37.7749, lng: -122.4194, displayName: "San Francisco" };

    cache.setReverse(37.77491, -122.41941, place);
    // Slight shift (less than 0.00005 deg) should hit the same 4-decimal place key
    const hit = cache.getReverse(37.77494, -122.41939);
    assert.deepEqual(hit, place);

    // Far shift should miss
    const miss = cache.getReverse(37.7800, -122.4200);
    assert.equal(miss, undefined);
  });

  // Test 4: NominatimProvider query validation
  await runTest("NominatimProvider immediately rejects queries shorter than minQueryLength without fetch", async () => {
    const provider = new NominatimProvider({ minQueryLength: 3 });

    const rEmpty = await provider.search("");
    const rShort1 = await provider.search("ab");
    const rShort2 = await provider.search("  a   ");
    assert.deepEqual(rEmpty, []);
    assert.deepEqual(rShort1, []);
    assert.deepEqual(rShort2, []);

    const revInvalid = await provider.reverse(999, 999);
    assert.equal(revInvalid, null);
  });

  // Test 5: CompositeProvider fallback mechanism
  await runTest("CompositeProvider falls back to secondary provider if primary fails or returns empty", async () => {
    const failingPrimary: GeocoderProvider = {
      name: "mock-fail",
      search: async () => {
        throw new Error("Simulated network timeout");
      },
      reverse: async () => null,
    };

    const secondaryResults: PlaceResult[] = [
      { lat: 52.52, lng: 13.405, displayName: "Berlin, Germany" },
    ];
    const workingSecondary: GeocoderProvider = {
      name: "mock-success",
      search: async () => secondaryResults,
      reverse: async () => secondaryResults[0],
    };

    const composite = new CompositeProvider(failingPrimary, workingSecondary);
    const results = await composite.search("Berlin");
    assert.deepEqual(results, secondaryResults);

    const rev = await composite.reverse(52.52, 13.405);
    assert.deepEqual(rev, secondaryResults[0]);
  });

  // Test 6: CompositeProvider short-circuits on primary success
  await runTest("CompositeProvider returns primary results immediately when available", async () => {
    let secondaryCalled = false;
    const primaryResults: PlaceResult[] = [
      { lat: 41.9028, lng: 12.4964, displayName: "Rome, Italy" },
    ];

    const workingPrimary: GeocoderProvider = {
      name: "primary-fast",
      search: async () => primaryResults,
      reverse: async () => primaryResults[0],
    };

    const secondarySpy: GeocoderProvider = {
      name: "secondary-spy",
      search: async () => {
        secondaryCalled = true;
        return [];
      },
      reverse: async () => {
        secondaryCalled = true;
        return null;
      },
    };

    const composite = new CompositeProvider(workingPrimary, secondarySpy);
    const results = await composite.search("Rome");
    assert.deepEqual(results, primaryResults);
    assert.equal(secondaryCalled, false, "Secondary should not be called when primary succeeds");
  });

  // Test 7: ProxyProvider graceful degradation on backend absence
  await runTest("ProxyProvider falls back to client provider if backend API returns 404/network error", async () => {
    const clientResults: PlaceResult[] = [
      { lat: -33.8688, lng: 151.2093, displayName: "Sydney, Australia" },
    ];
    const clientFallback: GeocoderProvider = {
      name: "client-fallback",
      search: async () => clientResults,
      reverse: async () => clientResults[0],
    };

    // ProxyProvider with no server running in unit test environment
    const proxy = new ProxyProvider(clientFallback);
    const results = await proxy.search("Sydney");
    assert.deepEqual(results, clientResults);
  });

  // Test 8: Server Geocoding Service parameter validation and caching
  await runTest("Server geocoding service rejects invalid queries and coordinate ranges safely", async () => {
    const emptySearch = await serverGeocoding.search("");
    const shortSearch = await serverGeocoding.search("ny");
    assert.deepEqual(emptySearch, []);
    assert.deepEqual(shortSearch, []);

    const outOfBoundsLat = await serverGeocoding.reverse(95, 10);
    const outOfBoundsLng = await serverGeocoding.reverse(10, 195);
    const nanCoord = await serverGeocoding.reverse(NaN, 10);
    assert.equal(outOfBoundsLat, null);
    assert.equal(outOfBoundsLng, null);
    assert.equal(nanCoord, null);
  });

  console.log("\n-------------------------------------------------");
  console.log(`  Tests Passed: ${passedCount}`);
  console.log(`  Tests Failed: ${failedCount}`);
  console.log("-------------------------------------------------\n");

  if (failedCount > 0) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error("Fatal test runner error:", err);
  process.exit(1);
});
