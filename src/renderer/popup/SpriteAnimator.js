class SpriteAnimator {
  constructor(imgElement, basePath) {
    this.img = imgElement;
    this.basePath = basePath;
    this.timer = null;
  }

  play(state, { onComplete } = {}) {
    this.stop();
    const { images, frameDurationMs, loop } = state;
    let index = 0;

    const setFrame = () => {
      this.img.src = this.basePath + images[index];
    };
    setFrame();

    if (images.length <= 1 && !loop) {
      this.timer = setTimeout(() => {
        this.timer = null;
        if (onComplete) onComplete();
      }, frameDurationMs);
      return;
    }

    this.timer = setInterval(() => {
      index += 1;
      if (index >= images.length) {
        if (loop) {
          index = 0;
          setFrame();
        } else {
          this.stop();
          if (onComplete) onComplete();
        }
        return;
      }
      setFrame();
    }, frameDurationMs);
  }

  stop() {
    if (this.timer) {
      clearInterval(this.timer);
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
