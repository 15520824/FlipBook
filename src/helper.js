import memoize from 'lodash/memoize'

export const easeIn = x => Math.pow(x, 2);

export const easeOut = x => 1 - easeIn(1 - x);

export const easeInOut = function(x) {
  if (x < 0.5) { return easeIn(x * 2) / 2; } else { return 0.5 + (easeOut((x - 0.5) * 2) / 2); }
};

const pageUrl = (page, pages) => {
  return pages[page] || null
}

const boundingRight = (displayedPages, viewWidth, xMargin, rightPage, maxX, pages) => {
  if (displayedPages === 1) { return viewWidth - xMargin }
  else {
      const x = pageUrl(rightPage, pages) ? viewWidth - xMargin : viewWidth / 2
      return x > maxX ? x : maxX
  }
}

const boundingLeft = (displayedPages, viewWidth, xMargin, leftPage, minX, pages) => {
  if (displayedPages === 1) { return xMargin }
  else {
      const x = pageUrl(leftPage, pages) ? xMargin : viewWidth / 2
      return x < minX ? x : minX 
  }
}

const pageWidth = (imageWidth, pageScale) => {
  return Math.round(imageWidth * pageScale)
}

const pageHeight = (imageHeight, pageScale) => Math.round(imageHeight * pageScale)

const xMargin = (viewWidth, pageWidth, displayedPages) => {
  console.log('xMargin', viewWidth, pageWidth, displayedPages);
  return (viewWidth - pageWidth * displayedPages) / 2
}

const yMargin = (viewHeight, pageHeight) => (viewHeight - pageHeight) / 2

const centerOffsetSmoothed = (currentCenterOffset) => Math.round(currentCenterOffset)

export const _pageUrl = memoize(pageUrl)
export const _boundingRight = memoize(boundingRight)
export const _boundingLeft = memoize(boundingLeft)
export const _pageWidth = memoize(pageWidth)
export const _pageHeight = memoize(pageHeight)
export const _xMargin = memoize(xMargin)
export const _yMargin = memoize(yMargin)
export const _centerOffsetSmoothed = memoize(centerOffsetSmoothed)
