import { Container } from "unstated";

class FlipBookStore extends Container {
  state = {
    pageWidth: 640,
    pageHeight: 906,
    leftPage: 0,
    rightPage: 1,
  };
}

const FlipBookContainer = new FlipBookStore();

export default FlipBookContainer;
