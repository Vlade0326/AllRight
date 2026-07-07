pragma circom 2.1.0;

include "comparators.circom";

// Square geofence: prove userLat/userLon are within public bounds (micro-degrees).
template GeofenceSquare(n) {
    signal input userLat;
    signal input userLon;
    signal input minLat;
    signal input maxLat;
    signal input minLon;
    signal input maxLon;
    signal output isInside;

    component latLower = LessEqThan(n);
    component latUpper = LessEqThan(n);
    component lonLower = LessEqThan(n);
    component lonUpper = LessEqThan(n);

    latLower.in[0] <== minLat;
    latLower.in[1] <== userLat;
    latUpper.in[0] <== userLat;
    latUpper.in[1] <== maxLat;
    lonLower.in[0] <== minLon;
    lonLower.in[1] <== userLon;
    lonUpper.in[0] <== userLon;
    lonUpper.in[1] <== maxLon;

    isInside <== latLower.out * latUpper.out * lonLower.out * lonUpper.out;
}

component main { public [minLat, maxLat, minLon, maxLon] } = GeofenceSquare(32);
