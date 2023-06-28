import memoize from 'lodash/memoize'
import Matrix from './matrix'

const IE = /Trident/.test(navigator.userAgent)
const gloss = 0.6
const nPolygons = 10
const perspective = '2400px'

const pageUrl = (pages, page) => {
  if (!pages[page]) return null
  // if (!pages[page].url) return default
  return pages[page].url || null;
}

const canFlipLeft = (flip, currentPage, displayedPages, leftPage, pages) => {
  return (
    !flip.direction &&
    (currentPage >= displayedPages) &&
    !(displayedPages === 1 && !pageUrl(pages, leftPage - 1))
  )
}


const canFlipRight = (flip, currentPage, nPages, displayedPages) => {
  return !flip.direction && currentPage < nPages - displayedPages
}

const polygonWidth = pageWidth => {
  var w;
  w = pageWidth / nPolygons;
  w = Math.ceil(w + 1);
  return w + 'px';
}

const polygonHeight = pageHeight => {
  return pageHeight + 'px';
}

const polygonBgSize = (pageWidth, pageHeight) => {
  return `${pageWidth}px ${pageHeight}px`;
}

const makePolygonArray = (face, flip, displayedPages, pageWidth, xMargin, spaceTop, minX, maxX, setMinX, setMaxX) => {
  var ax,
      bgImg,
      bgPos,
      dRadian,
      dRotate,
      direction,
      gx,
      i,
      image,
      j,
      lighting,
      originRight,
      pageRotation,
      pageTransform,
      polygonWidth,
      progress,
      rad,
      radian,
      radius,
      ref,
      results,
      rotate,
      tfString,
      theta,
      transform,
      x,
      z;
  if (!flip.direction) {
    return [];
  }
  progress = flip.progress;
  direction = flip.direction;
  if (displayedPages === 1 && direction === 'left') {
    progress = 1 - progress;
    direction = 'right';
  }
  image = face === 'front' ? flip.frontImage : flip.backImage;
  bgImg = image && `url('${image}')`;
  polygonWidth = pageWidth / nPolygons;
  gx = xMargin;
  originRight = false;
  if (displayedPages === 1) {
    if (face === 'back') {
      originRight = true;
      gx = xMargin - pageWidth;
    }
  } else {
    if (direction === 'left') {
      if (face === 'back') {
        gx = pageWidth;
      } else {
        originRight = true;
      }
    } else {
      if (face === 'front') {
        gx = pageWidth;
      } else {
        originRight = true;
      }
    }
  }
  pageTransform = new Matrix();
  pageTransform.translate(gx, spaceTop);
  pageRotation = 0;
  if (progress > 0.5) {
    pageRotation = -(progress - 0.5) * 2 * 180;
  }
  if (direction === 'left') {
    pageRotation = -pageRotation;
  }
  if (face === 'back') {
    pageRotation += 180;
  }
  if (pageRotation) {
    if (originRight) {
      pageTransform.translate(pageWidth);
    }
    pageTransform.rotateY(pageRotation);
    if (originRight) {
      pageTransform.translate(-pageWidth);
    }
  }
  if (progress < 0.5) {
    theta = progress * 2 * Math.PI;
  } else {
    theta = (1 - (progress - 0.5) * 2) * Math.PI;
  }
  if (theta === 0) {
    theta = 1e-9;
  }
  radius = pageWidth / theta;
  radian = 0;
  dRadian = theta / nPolygons;
  rotate = dRadian / 2 / Math.PI * 180;
  dRotate = dRadian / Math.PI * 180;
  if (originRight) {
    rotate = -theta / Math.PI * 180 + dRotate / 2;
  }
  if (face === 'back') {
    rotate = -rotate;
    dRotate = -dRotate;
  }
  setMinX(Infinity)
  setMaxX(-Infinity)
  results = [];
  for (i = j = 0, ref = nPolygons; (0 <= ref ? j < ref : j > ref); i = 0 <= ref ? ++j : --j) {
    bgPos = `${i / (nPolygons - 1) * 100}% 0px`;
    transform = new Matrix(pageTransform);
    rad = originRight ? theta - radian : radian;
    x = Math.sin(rad) * radius;
    if (originRight) {
      x = pageWidth - x;
    }
    z = (1 - Math.cos(rad)) * radius;
    if (face === 'back') {
      z = -z;
    }
    transform.translate(x);
    transform.translateZ(z);
    transform.rotateY(-rotate);
    ax = transform.computeX();
    if (ax > maxX) {
      setMaxX(ax)
    }
    ax += 2 * polygonWidth;
    if (ax < minX) {
      setMinX(ax)
    }
    lighting = computeLighting(pageRotation - rotate, dRotate);
    tfString = `perspective(${perspective}) ${transform.toString()}`;
    radian += dRadian;
    rotate += dRotate;
    results.push([face + i, bgImg, lighting, bgPos, tfString, Math.abs(Math.round(z))]);
  }
  return results;
};

const computeLighting = (rot, dRotate, ambient) => {
  var DEG, POW, blackness, diffuse, gradients, lightingPoints, specular;
  gradients = [];
  lightingPoints = [-0.5, -0.25, 0, 0.25, 0.5];
  if (ambient < 1) {
    blackness = 1 - ambient;
    diffuse = lightingPoints.map((d) => {
      return (1 - Math.cos((rot - dRotate * d) / 180 * Math.PI)) * blackness;
    });
    gradients.push(`linear-gradient(to right,
      rgba(0, 0, 0, ${diffuse[0]}),
      rgba(0, 0, 0, ${diffuse[1]}) 25%,
      rgba(0, 0, 0, ${diffuse[2]}) 50%,
      rgba(0, 0, 0, ${diffuse[3]}) 75%,
      rgba(0, 0, 0, ${diffuse[4]}))`);
  }
  if (gloss > 0 && !IE) {
    DEG = 30;
    POW = 200;
    specular = lightingPoints.map((d) => {
      return Math.max(Math.cos((rot + DEG - dRotate * d) / 180 * Math.PI) ** POW, Math.cos((rot - DEG - dRotate * d) / 180 * Math.PI) ** POW);
    });
    gradients.push(`linear-gradient(to right,
      rgba(255, 255, 255, ${specular[0] * gloss}),
      rgba(255, 255, 255, ${specular[1] * gloss}) 25%,
      rgba(255, 255, 255, ${specular[2] * gloss}) 50%,
      rgba(255, 255, 255, ${specular[3] * gloss}) 75%,
      rgba(255, 255, 255, ${specular[4] * gloss}))`);
  }
  return gradients.join(',');
};

const polygonArray = (flip, displayedPages, pageWidth, xMargin, spaceTop, minX, maxX, setMinX, setMaxX) => {
  return makePolygonArray('front', flip, displayedPages, pageWidth, xMargin, spaceTop, minX, maxX, setMinX, setMaxX)
    .concat(makePolygonArray('back', flip, displayedPages, pageWidth, xMargin, spaceTop, minX, maxX, setMinX, setMaxX))
}

export const _canFlipLeft = memoize(canFlipLeft)
export const _canFlipRight = memoize(canFlipRight)
export const _polygonWidth = memoize(polygonWidth)
export const _polygonHeight = memoize(polygonHeight)
export const _polygonBgSize = memoize(polygonBgSize)
export const _polygonArray = memoize(polygonArray)
