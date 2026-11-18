const sum = (a, b) => a + b;
const subtract = (a, b) => a - b;
const multiply = (a, b) => a * b;
const divide = (a, b) => b !== 0 ? a / b : null;
const modulo = (a, b) => b !== 0 ? a % b : null;
const power = (a, b) => Math.pow(a, b);
const squareRoot = (a) => Math.sqrt(a);
const absolute = (a) => Math.abs(a);
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
