// Shared, non-reactive world state read by many components each frame.

export const trafficLights = {
  nsGreen: true,
  t: 0,
  tick(dt: number) {
    this.t += dt;
    if (this.t > 9) {
      this.t = 0;
      this.nsGreen = !this.nsGreen;
    }
  },
};

export const worldState = {
  playerPos: [0, 0, 0] as [number, number, number],
  playerSpeed: 0,
  grip: 1,
};
