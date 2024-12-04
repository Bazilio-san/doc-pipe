export const sleep = async (ms: number): Promise<void> => {
  const plusMinus = Math.random();
  let randomer = ms;
  if (plusMinus < 0.5) {
    randomer += (200 - (Math.random() * 100)) * Math.random();
  } else {
    randomer -= (200 - (Math.random() * 100)) * Math.random();
  }
  randomer = Math.abs(randomer);
  if (randomer === 0) {
    randomer = ms + (Math.random() + 100);
  }
  // console.log(randomer);
  return new Promise((resolve) => { setTimeout(resolve, randomer); });
};
