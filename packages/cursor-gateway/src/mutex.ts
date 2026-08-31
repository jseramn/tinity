export class JobMutex {
  #busy = false;

  get busy(): boolean {
    return this.#busy;
  }

  tryAcquire(): boolean {
    if (this.#busy) return false;
    this.#busy = true;
    return true;
  }

  release(): void {
    this.#busy = false;
  }
}
