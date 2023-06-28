import React, { useEffect, useState } from "react";
import { Subscribe } from "unstated";
import FlipBookContainer from "../Stores/Flipbook";
import {
  _canFlipLeft,
  _canFlipRight,
  _polygonArray,
  _polygonBgSize,
  _polygonHeight,
  _polygonWidth,
} from "../computed";
import { easeInOut } from "../helper";
import "./Styles.css";

const Flipbook = ({ flipDuration = 1000, spaceTop = 0 }) => {
  const flipInit = {
    progress: 0,
    direction: null,
    frontImage: null,
    backImage: null,
    auto: false,
  };

  const { pageWidth, pageHeight, leftPage, rightPage } =
    FlipBookContainer.state;

  const [nPages, setNPages] = useState(136);
  const [displayedPages, setDisplayedPages] = useState(1);
  const [nImageLoad, setNImageLoad] = useState(0);
  const [nImageLoadTrigger, setNImageLoadTrigger] = useState(0);
  const [imageLoadCallback, setImageLoadCallback] = useState(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchStartY, setTouchStartY] = useState(null);
  const [hasPointerEvents, setHasPointerEvents] = useState(false);
  const [minX, setMinX] = useState(Infinity);
  const [maxX, setMaxX] = useState(-Infinity);
  const [preloadedImages, setPreloadedImages] = useState({});
  const [flip, setFlip] = useState(flipInit);
  const [xMargin, setXMargin] = useState(0); // this.pageWidth * 2 - this.pageWidth * this.displayedPages) / 2
  const [action, setAction] = useState(false);
  const [prevDirection, setPrevDirection] = useState("right");
  // computed
  const canFlipLeft = _canFlipLeft(flip, currentPage, displayedPages, leftPage);
  const canFlipRight = _canFlipRight(flip, currentPage, nPages, displayedPages);
  const polygonArray = _polygonArray(
    flip,
    displayedPages,
    pageWidth,
    xMargin,
    spaceTop,
    minX,
    maxX,
    setMinX,
    setMaxX
  );
  const polygonBgSize = _polygonBgSize(pageWidth, pageHeight);
  const polygonWidth = _polygonWidth(pageWidth);
  const polygonHeight = _polygonHeight(pageHeight);

  useEffect(() => {
    onResize();
    preloadImages();
  }, []);

  useEffect(() => {
    FlipBookContainer.setState({
      leftPage: currentPage,
      rightPage: currentPage + 1,
    });
    logEvery();
    preloadImages();
  }, [currentPage]);
  // method
  const onResize = () => {
    setDisplayedPages(pageWidth * 2 > pageHeight ? 2 : 1);
  };

  const logEvery = () => {
    console.log({
      currentPage: currentPage,
      displayedPages: displayedPages,
      flip: flip,
      hasPointerEvents: hasPointerEvents,
      imageLoadCallback: imageLoadCallback,
      leftPage: leftPage,
      maxX: maxX,
      minX: minX,
      nImageLoad: nImageLoad,
      nImageLoadTrigger: nImageLoadTrigger,
      nPages: nPages,
      pageHeight: pageHeight,
      pageWidth: pageWidth,
      preloadedImages: preloadImages,
      rightPage: rightPage,
      touchStartX: touchStartX,
      touchStartY: touchStartY,
      canFlipLeft: canFlipLeft,
      canFlipRight: canFlipRight,
      polygonArray: polygonArray,
      polygonBgSize: polygonBgSize,
      polygonWidth: polygonWidth,
      polygonHeight: polygonHeight,
    });
  };

  const pageUrl = (page) => {
    if (page === 0) return null;
    return (
      "images/OnePiece/Sách vui dao-hai-tac-phan-1-" +
      ("000" + page).substr(-3) +
      ".png"
    );
  };

  const flipStart = async (direction, auto) => {
    if (direction === "left") {
      if (displayedPages === 1) {
        setFlip((prev) => {
          return {
            ...prev,
            direction: direction,
            frontImage: pageUrl(currentPage - 1),
            backImage: null,
          };
        });
      } else {
        setFlip((prev) => {
          let frontImage = pageUrl(leftPage);
          let backImage = pageUrl(currentPage - displayedPages + 1);
          if (prevDirection === "right") {
            frontImage = prev.backImage;
          }
          return {
            ...prev,
            direction: direction,
            frontImage: frontImage,
            backImage: backImage,
          };
        });
      }
    } else {
      if (displayedPages === 1) {
        setFlip((prev) => {
          return {
            ...prev,
            direction: direction,
            frontImage: pageUrl(currentPage),
            backImage: null,
          };
        });
      } else {
        setFlip((prev) => {
          let frontImage = pageUrl(rightPage);
          let backImage = pageUrl(currentPage + displayedPages);
          if (prevDirection === "left") {
            frontImage = prev.backImage;
          }
          return {
            ...prev,
            direction: direction,
            frontImage: frontImage,
            backImage: backImage,
          };
        });
      }
    }
    requestAnimationFrame(() => {
      return requestAnimationFrame(() => {
        if (direction === "left") {
          if (displayedPages === 2) {
            FlipBookContainer.setState({
              leftPage: currentPage - displayedPages,
            });
          }
        } else {
          if (displayedPages === 1) {
            FlipBookContainer.setState({
              leftPage: currentPage + displayedPages,
            });
          } else {
            FlipBookContainer.setState({
              rightPage: currentPage + 1 + displayedPages,
            });
          }
        }
        if (auto) {
          return flipAuto(true);
        }
      });
    });
  };

  const flipAuto = (ease) => {
    var animate, duration, startRatio, t0;
    t0 = Date.now();
    duration = flipDuration * (1 - flip.progress);
    startRatio = flip.progress;
    setFlip((prev) => {
      return {
        ...prev,
        auto: true,
      };
    });
    animate = () => {
      return requestAnimationFrame(() => {
        var ratio, t;
        t = Date.now() - t0;
        ratio = startRatio + t / duration;
        if (ratio > 1) {
          ratio = 1;
        }
        setFlip((prev) => {
          return {
            ...prev,
            progress: ease ? easeInOut(ratio) : ratio,
          };
        });
        if (ratio < 1) {
          return animate();
        } else {
          setPrevDirection(flip.direction);
          if (flip.direction === "left") {
            setCurrentPage(currentPage - displayedPages);
          } else {
            setCurrentPage(currentPage + displayedPages);
          }
          if (displayedPages === 1 && flip.direction === "right") {
            setFlip((prev) => {
              return {
                ...prev,
                direction: null,
                auto: false,
                progress: 0,
              };
            });
          } else {
            onImageLoad(1, () => {
              setFlip((prev) => {
                return {
                  ...prev,
                  direction: null,
                  auto: false,
                  progress: 0,
                };
              });
            });
          }
        }
      });
    };
    return animate();
  };

  const onImageLoad = (trigger, cb) => {
    setNImageLoad(0);
    setNImageLoadTrigger(trigger);
    setImageLoadCallback(cb);
  };

  const flipRevert = () => {
    var animate, duration, startRatio, t0;
    t0 = Date.now();
    duration = flipDuration * flip.progress;
    startRatio = flip.progress;
    setFlip((prev) => {
      return {
        ...prev,
        auto: true,
      };
    });
    animate = () => {
      return requestAnimationFrame(() => {
        var ratio, t;
        t = Date.now() - t0;
        ratio = startRatio - (startRatio * t) / duration;
        if (ratio < 0) {
          ratio = 0;
        }
        setFlip((prev) => {
          return {
            ...prev,
            progress: ratio,
          };
        });
        if (ratio > 0) {
          return animate();
        } else {
          FlipBookContainer.setState({
            leftPage: currentPage,
            rightPage: currentPage + 1,
          });
          if (displayedPages === 1 && flip.direction === "left") {
            setFlip((prev) => {
              return {
                ...prev,
                direction: null,
                auto: false,
              };
            });
          } else {
            onImageLoad(1, () => {
              setFlip((prev) => {
                return {
                  ...prev,
                  direction: null,
                  auto: false,
                };
              });
            });
          }
          return false;
        }
      });
    };
    return animate();
  };

  const didLoadImage = (ev) => {
    if (!imageLoadCallback) {
      return;
    }
    imageLoadCallback();
  };

  const swipeStart = (touch) => {
    setTouchStartX(touch.pageX);
    setTouchStartY(touch.pageY);
  };

  const swipeMove = (touch) => {
    var x, y;
    if (touchStartX == null) {
      return;
    }
    x = touch.pageX - touchStartX;
    y = touch.pageY - touchStartY;
    if (Math.abs(y) > Math.abs(x)) {
      return;
    }
    if (x > 0) {
      if (flip.direction === null && canFlipLeft && x >= 5) {
        flipStart("left", false);
      }
      if (flip.direction === "left") {
        setFlip((prev) => {
          return {
            ...prev,
            progress: x / pageWidth < 1 ? x / pageWidth : 1,
          };
        });
      }
    } else {
      if (flip.direction === null && canFlipRight && x <= -5) {
        flipStart("right", false);
      }
      if (flip.direction === "right") {
        setFlip((prev) => {
          return {
            ...prev,
            progress: -x / pageWidth < 1 ? -x / pageWidth : 1,
          };
        });
      }
    }
    return true;
  };

  const swipeEnd = (touch) => {
    if (flip.direction !== null && !flip.auto) {
      if (flip.progress > 1 / 4) {
        flipAuto(false);
      } else {
        flipRevert();
      }
    }
    setTouchStartX(null);
    return null;
  };

  const onMouseDown = (ev) => {
    if (hasPointerEvents) {
      return;
    }
    if (ev.which && ev.which !== 1) {
      return;
    }
    return swipeStart(ev);
  };
  const onMouseMove = (ev) => {
    if (hasPointerEvents) {
      return;
    }
    if (ev.which && ev.which !== 1) {
      return;
    } // Ignore right-click
    return swipeMove(ev);
  };

  const onMouseUp = (ev) => {
    if (!hasPointerEvents) {
      return swipeEnd(ev);
    }
  };

  const preloadImages = () => {
    var i, img, j, ref, ref1, results, url;
    results = [];
    for (
      i = j = ref = currentPage - 3, ref1 = currentPage + 3;
      ref <= ref1 ? j <= ref1 : j >= ref1;
      i = ref <= ref1 ? ++j : --j
    ) {
      url = pageUrl(i);
      if (url) {
        if (!preloadedImages[url]) {
          img = new Image();
          img.src = url;
          results.push((preloadedImages[url] = img));
        } else {
          results.push(void 0);
        }
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  useEffect(() => {
    function keyDown(ev) {
      if (ev.keyCode === 37 && canFlipRight) {
        flipStart("right", false);
        setAction(true);
      }
      if (ev.keyCode === 39 && canFlipLeft) {
        flipStart("left", false);
        setAction(true);
      }
    }
    window.addEventListener("keydown", keyDown);
    return () => {
      window.removeEventListener("keydown", keyDown);
    };
  });

  useEffect(() => {
    if (!action) return;
    flipAuto(false);
    setAction(false);
  }, [action]);

  return (
    <Subscribe to={[FlipBookContainer]}>
      {(flipBookContainer) => {
        const { pageWidth, pageHeight, leftPage, rightPage } =
          flipBookContainer.state;
        return (
          <div
            onMouseDown={(ev) => onMouseDown(ev)}
            onMouseMove={(ev) => onMouseMove(ev)}
            onMouseUp={(ev) => onMouseUp(ev)}
            style={{
              width: pageWidth * displayedPages + "px",
              height: pageHeight + "px",
              margin: "auto",
            }}
          >
            <div className="viewport">
              <div className="container" style={{ width: "100%" }}>
                <div className="guard" />
                <div
                  className="centering-box"
                  style={{ width: pageWidth * displayedPages }}
                >
                  {pageUrl(leftPage) && (
                    <img
                      className="page fixed"
                      style={{
                        width: pageWidth + "px",
                        height: pageHeight + "px",
                        left: xMargin + "px",
                        top: spaceTop + "px",
                      }}
                      src={pageUrl(leftPage)}
                      onLoad={($event) => didLoadImage($event)}
                      onClick={() => {
                        console.log("left");
                        flipStart("left", false);
                        setAction(true);
                      }}
                    />
                  )}
                  {displayedPages === 2 && pageUrl(rightPage) && (
                    <img
                      className="page fixed"
                      style={{
                        width: pageWidth + "px",
                        height: pageHeight + "px",
                        left: pageWidth + "px",
                        top: spaceTop + "px",
                      }}
                      src={pageUrl(rightPage)}
                      onLoad={($event) => didLoadImage($event)}
                      onClick={() => {
                        console.log("right");
                        flipStart("right", false);
                        setAction(true);
                      }}
                    />
                  )}
                  {polygonArray.map((item, index) => {
                    return (
                      <div
                        key={index}
                        className={item[1] ? "polygon blank" : "polygon"}
                        style={{
                          backgroundImage: item[1],
                          backgroundSize: polygonBgSize,
                          backgroundPosition: item[3],
                          width: polygonWidth,
                          height: polygonHeight,
                          transform: item[4],
                          zIndex: item[5],
                        }}
                      >
                        {item[2].length && (
                          <div
                            className="lighting"
                            style={{ backgroundImage: item[2] }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </Subscribe>
  );
};

export default Flipbook;
