// Object pool for Kim's Game.
// Photos live in /public/kim/<slug>.jpg (see public/kim/README.md).
// If a photo is missing or fails to load, the game shows the emoji tile instead.

export const OBJECTS = [
  { id: "apple", name: "Apple", emoji: "🍎", aliases: ["red apple"] },
  { id: "wristwatch", name: "Wristwatch", emoji: "⌚", aliases: ["watch", "wrist watch", "analog watch"] },
  { id: "mug", name: "Coffee Mug", emoji: "☕", aliases: ["mug", "cup", "coffee cup", "tea cup"] },
  { id: "camera", name: "Camera", emoji: "📷", aliases: ["digital camera"] },
  { id: "key", name: "Key", emoji: "🔑", aliases: ["house key", "door key"] },
  { id: "book", name: "Book", emoji: "📕", aliases: ["hardcover book", "hardback"] },
  { id: "sunglasses", name: "Sunglasses", emoji: "🕶️", aliases: ["shades", "sun glasses"] },
  { id: "flower", name: "Flower", emoji: "🌸", aliases: ["pink flower", "blossom"] },
  { id: "headphones", name: "Headphones", emoji: "🎧", aliases: ["headset", "earphones"] },
  { id: "bottle", name: "Water Bottle", emoji: "🍼", aliases: ["bottle", "flask"] },
  { id: "banana", name: "Banana", emoji: "🍌", aliases: [] },
  { id: "lamp", name: "Lamp", emoji: "💡", aliases: ["table lamp", "desk lamp"] },
  { id: "guitar", name: "Guitar", emoji: "🎸", aliases: ["acoustic guitar"] },
  { id: "football", name: "Football", emoji: "⚽", aliases: ["soccer ball", "ball", "soccer"] },
  { id: "umbrella", name: "Umbrella", emoji: "☂️", aliases: ["brolly"] },
  { id: "glasses", name: "Reading Glasses", emoji: "👓", aliases: ["glasses", "eyeglasses", "spectacles", "specs"] },
  { id: "scissors", name: "Scissors", emoji: "✂️", aliases: ["scissor"] },
  { id: "candle", name: "Candle", emoji: "🕯️", aliases: [] },
  { id: "backpack", name: "Backpack", emoji: "🎒", aliases: ["bag", "rucksack", "school bag"] },
  { id: "pencil", name: "Pencil", emoji: "✏️", aliases: [] },
  { id: "hat", name: "Hat", emoji: "🎩", aliases: ["cap"] },
  { id: "shoe", name: "Shoe", emoji: "👟", aliases: ["sneaker", "trainer"] },
  { id: "spoon", name: "Spoon", emoji: "🥄", aliases: [] },
  { id: "toothbrush", name: "Toothbrush", emoji: "🪥", aliases: ["tooth brush"] },
];

export const DIFFICULTIES = {
  easy: { label: "Easy", count: 8, seconds: 40 },
  medium: { label: "Medium", count: 12, seconds: 30 },
  hard: { label: "Hard", count: 16, seconds: 25 },
};
