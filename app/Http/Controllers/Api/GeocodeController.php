<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeocodeController extends Controller
{
    private const VIEWBOX = '8.2,2.8,16.2,12.6';

    public function search(Request $request): JsonResponse
    {
        $validated = $request->validate(['q' => 'required|string|max:200']);
        $query = $validated['q'];

        $results = $this->nominatimSearch($query, ['countrycodes' => 'cm', 'bounded' => 1]);

        if (empty($results)) {
            $results = $this->nominatimSearch($query, ['countrycodes' => 'cm']);
        }

        if (empty($results)) {
            $results = $this->nominatimSearch($query, []);
        }

        return response()->json($results);
    }

    private function nominatimSearch(string $query, array $extra): array
    {
        try {
            $params = array_merge([
                'q' => $query,
                'format' => 'json',
                'limit' => 8,
                'viewbox' => self::VIEWBOX,
                'addressdetails' => 0,
            ], $extra);

            $response = Http::withHeaders([
                'User-Agent' => 'SmartBin/1.0 (smartbin.cm)',
                'Accept-Language' => 'fr',
            ])->timeout(5)->retry(2, 500)->get('https://nominatim.openstreetmap.org/search', $params);

            if (!$response->ok()) {
                return [];
            }

            return $response->json() ?? [];
        } catch (\Throwable $e) {
            Log::warning('Nominatim search failed', ['query' => $query, 'error' => $e->getMessage()]);
            return [];
        }
    }
}
