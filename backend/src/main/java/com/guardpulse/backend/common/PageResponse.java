package com.guardpulse.backend.common;

import java.util.List;

/**
 * Mirrors DRF's default pagination envelope ({count, next, previous, results})
 * so the existing React frontend needs no changes when talking to this backend.
 * We don't paginate for real (catalog is small) — next/previous are always null.
 */
public record PageResponse<T>(long count, String next, String previous, List<T> results) {
    public static <T> PageResponse<T> of(List<T> results) {
        return new PageResponse<>(results.size(), null, null, results);
    }
}


