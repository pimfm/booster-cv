// Test fixture — invalid/missing-card. Plain object on purpose (no define helpers).
export default [
  {
    "id": "one",
    "name": {
      "en": "One",
      "nl": "Een"
    },
    "blurb": {
      "en": "First.",
      "nl": "Eerste."
    },
    "tint": 1,
    "cards": [
      "alpha",
      "beta",
      "gamma",
      "ghost"
    ]
  },
  {
    "id": "two",
    "name": {
      "en": "Two",
      "nl": "Twee"
    },
    "blurb": {
      "en": "Second.",
      "nl": "Tweede."
    },
    "tint": 2,
    "cards": [
      "delta",
      "epsilon"
    ]
  }
];
