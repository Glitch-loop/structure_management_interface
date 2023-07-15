const randomNumber = (maximumNumber:number):number => {
  return Math.floor((Math.random() * maximumNumber) + 1)
}

const createRGBColor = (R:number, G:number, B:number):number[] => {
  const color1 = randomNumber(R);
  const color2 = randomNumber(G);
  const color3 = randomNumber(B);
  return [color1, color2, color3];
}

export {
  randomNumber,
  createRGBColor
}