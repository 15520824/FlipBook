import {
  identity,
  multiply,
  translate,
  translateZ,
  rotateY
} from 'rematrix';

export default class Matrix {
  constructor(arg) {
    if (arg) {
      if (Array.isArray(arg)) {
        this.m = arg;
      } else {
        this.m = [...arg.m];
      }
    } else {
      this.m = identity();
    }
  }

  multiply(m) {
    if (!Array.isArray(m)) {
      m = m.m;
    }
    return this.m = multiply(this.m, m);
  }

  computeX() {
    return this.m[12];
  }

  translate(x, y) {
    return this.multiply(translate(x, y));
  }

  translateZ(z) {
    return this.multiply(translateZ(z));
  }

  rotateY(deg) {
    return this.multiply(rotateY(deg));
  }

  toString() {
    return `matrix3d(${this.m.toString()})`;
  }

};