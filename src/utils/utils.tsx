const randomNumber = (maximumNumber:number):number => {
  return Math.floor((Math.random() * maximumNumber) + 1)
}

const createRGBColor = (R:number, G:number, B:number):number[] => {
  const color1 = randomNumber(R);
  const color2 = randomNumber(G);
  const color3 = randomNumber(B);
  return [color1, color2, color3];
}

const avoidNull = (data: any, replace: any):any => {
  return data === null ? replace : data;
}

const getPercentage = (basis: number|undefined, target: number|undefined):number => {
  let result = 0;

  if(basis !== undefined && target !== undefined) {
    result = target * 100 / basis
  }

  if(result > 100) result = 100;

  return result;
}

export {
  randomNumber,
  createRGBColor,
  avoidNull,
  getPercentage
}