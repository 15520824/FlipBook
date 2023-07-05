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

  const { pageWidth, pageHeight, pages, leftPage, rightPage } =
    FlipBookContainer.state;

  const [nPages, setNPages] = useState(pages.length + 1);
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
  const canFlipLeft = _canFlipLeft(
    flip,
    currentPage,
    displayedPages,
    leftPage,
    pages
  );
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
    setDisplayedPages(pageWidth * 2 <= window.innerWidth ? 2 : 1);
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
    if (!pages[page]) return null;
    return pages[page].url || null;
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
    if (touch.pageX) setTouchStartX(touch.pageX);
    else setTouchStartX(touch.changedTouches[0].pageX);
    if (touch.pageX) setTouchStartY(touch.pageY);
    else setTouchStartY(touch.changedTouches[0].pageY);
  };

  const swipeMove = (touch) => {
    var x, y;
    if (touchStartX == null) {
      return;
    }
    if (touch.pageX) x = touch.pageX - touchStartX;
    else x = touch.changedTouches[0].pageX - touchStartX;
    if (touch.pageY) y = touch.pageY - touchStartY;
    else y = touch.changedTouches[0].pageY - touchStartY;

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

  const handleClickPage = (ev) => {
    const center = window.innerWidth / 2;
    if (ev.pageX < center) {
      if (canFlipLeft) {
        flipStart("left", false);
        setAction(true);
      }
    } else {
      if (canFlipRight) {
        flipStart("right", false);
        setAction(true);
      }
    }
  };

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
          <>
            <div style={{ height: "55px", display: "flex" }}>
              <div style={{ flexShrink: 0 }}></div>
              <div style={{ flexGrow: 1 }}></div>
              <div style={{ flexShrink: 0 }}></div>
            </div>
            <div style={{ backgroundColor: "#E0F3FC", color: "#74A2C3" }}>
              <div
                style={{
                  height: "55px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                }}
              >
                <svg
                  fill="#74A2C3"
                  width="16px"
                  height="16px"
                  viewBox="0 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <title>clock</title>
                  <path d="M0 7.008q0 1.856 0.992 3.52 1.184-3.328 3.712-5.824t5.824-3.712q-1.696-0.992-3.52-0.992-2.912 0-4.96 2.080t-2.048 4.928zM2.016 16q0 2.784 1.056 5.312t2.944 4.48v4.224q0 0.832 0.576 1.408t1.408 0.576 1.408-0.576 0.608-1.408v-1.408q2.912 1.408 5.984 1.408t6.016-1.408v1.408q0 0.832 0.576 1.408t1.408 0.576 1.408-0.576 0.608-1.408v-4.224q1.888-1.952 2.944-4.448t1.056-5.344-1.12-5.44-2.976-4.48-4.48-2.976-5.44-1.12-5.44 1.12-4.48 2.976-2.976 4.48-1.088 5.44zM6.016 16q0-2.048 0.768-3.872t2.144-3.2 3.2-2.144 3.872-0.8q2.72 0 5.024 1.344t3.648 3.648 1.344 5.024q0 2.016-0.8 3.872t-2.144 3.2-3.2 2.144-3.872 0.768q-2.72 0-5.024-1.312t-3.616-3.648-1.344-5.024zM14.016 16q0 0.832 0.576 1.408t1.408 0.576h4q0.832 0 1.408-0.576t0.608-1.408-0.608-1.408-1.408-0.608h-1.984v-1.984q0-0.832-0.608-1.408t-1.408-0.608-1.408 0.608-0.576 1.408v4zM21.472 0.992q3.328 1.216 5.824 3.712t3.712 5.824q0.992-1.664 0.992-3.52 0-2.88-2.048-4.928t-4.96-2.080q-1.824 0-3.52 0.992z"></path>
                </svg>
                <span style={{ marginLeft: "6px" }}>
                  Thời gian đọc còn lại:
                </span>
                <span style={{ marginLeft: "6px", marginRight: "6px" }}>
                  {Math.floor((pages.length - currentPage) / 40)} giờ{" "}
                  {Math.floor(
                    ((pages.length - currentPage) / 40 -
                      Math.floor((pages.length - currentPage) / 40)) *
                      60
                  ) < 10
                    ? "0" +
                      Math.floor(
                        ((pages.length - currentPage) / 40 -
                          Math.floor((pages.length - currentPage) / 40)) *
                          60
                      ).toString()
                    : Math.floor(
                        ((pages.length - currentPage) / 40 -
                          Math.floor((pages.length - currentPage) / 40)) *
                          60
                      ).toString()}{" "}
                  phút
                </span>
                <svg
                  width="16px"
                  height="16px"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M7.29417 12.9577L10.5048 16.1681L17.6729 9"
                    stroke="#74A2C3"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="#74A2C3"
                    strokeWidth="2"
                  />
                </svg>
                <span style={{ marginLeft: "6px", marginRight: "6px" }}>-</span>
                <span style={{ marginRight: "6px" }}>Đã đọc:</span>
                <span>{Math.floor((currentPage / pages.length) * 100)} % </span>
              </div>
              <div
                onTouchStart={(ev) => onMouseDown(ev)}
                onTouchMove={(ev) => onMouseMove(ev)}
                onTouchEnd={(ev) => onMouseUp(ev)}
                onMouseDown={(ev) => onMouseDown(ev)}
                onMouseMove={(ev) => onMouseMove(ev)}
                onMouseUp={(ev) => onMouseUp(ev)}
                onClick={(ev) => handleClickPage(ev)}
                style={{
                  width: pageWidth * displayedPages + "px",
                  height: pageHeight + "px",
                  margin: "auto",
                  padding: "20px 40px",
                  background: "linear-gradient(#3472A2, #DEF2FB)",
                }}
              >
                <div className="viewport">
                  <div className="container" style={{ width: "100%" }}>
                    <div
                      className="centering-box"
                      style={{
                        width: pageWidth * displayedPages,
                      }}
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
                          alt={pageUrl(leftPage)}
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
                          alt={pageUrl(rightPage)}
                        />
                      )}
                      {pageUrl(leftPage) && (
                        <div
                          className="page fixed"
                          style={{
                            width: "4px",
                            height: pageHeight * 0.9 + "px",
                            left: pageWidth - 2 + "px",
                            top: spaceTop + pageHeight * 0.05 + "px",
                            backgroundColor: "#E8E7E7",
                            borderRadius: "10px",
                            zIndex: "10",
                          }}
                        ></div>
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
                    <div className="guard" />
                  </div>
                </div>
              </div>
              <div style={{ height: "55px" }}></div>
            </div>
          </>
        );
      }}
    </Subscribe>
  );
};

export default Flipbook;
