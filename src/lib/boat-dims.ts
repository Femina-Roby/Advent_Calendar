// Shared dimensions of the houseboat, in metres. The bow points to -x, starboard is +z.
// The scene, the gift positions and the tests all read from here so they never drift apart.
export const WATER_Y = 0.55;
export const HULL_HEIGHT = 1.0;
export const DECK_Y = 1.11;

// Lower floor (cabin).
export const WALL_Z = 1.3;
export const WALL_TOP = 2.88;
export const CAB_X0 = -3.0; // front wall (door)
export const CAB_X1 = 2.6; // rear wall (kitchen hatch)

// Upper floor: a flat sundeck at the front and a smaller cabin with the arched thatch roof.
export const UP_Y = 2.98;
export const UP_Z = 1.1;
export const UP_WALL_TOP = 4.22;
export const UP_X0 = -1.4; // front wall of the upper cabin (double doors)
export const UP_X1 = 2.4;
export const SLAB_X0 = -3.45;
export const SLAB_X1 = 3.05;

export const ROOF_BASE_Y = 4.08;
export const ROOF_R = 1.12;
export const ROOF_THICK = 0.14;
export const ROOF_V = 0.6;
export const ROOF_LENGTH = 4.8;
export const ROOF_CX = 0.5;
export const RIDGE_Y = ROOF_BASE_Y + (ROOF_R + ROOF_THICK) * ROOF_V + 0.02;

// Helm on the sundeck.
export const HELM_X = -3.15;
export const WHEEL_X = -2.82;
export const WHEEL_Y = UP_Y + 1.07;
export const DRIVER_X = -2.3;
