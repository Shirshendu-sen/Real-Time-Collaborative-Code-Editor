export const DEFAULT_LANGUAGE = "javascript";

export const LANGUAGES = {
  javascript: {
    id: "javascript",
    label: "JavaScript",
    image: "code-sandbox",
    fileName: "main.js",
    runCommand: ["node", "main.js"],
    compileCommand: null,
    usesLegacyRunner: true,
  },
  python: {
    id: "python",
    label: "Python",
    image: "code-sandbox-py",
    fileName: "main.py",
    runCommand: ["python3", "main.py"],
    compileCommand: null,
  },
  java: {
    id: "java",
    label: "Java",
    image: "code-sandbox-java",
    fileName: "Main.java",
    runCommand: ["java", "Main.java"],
    compileCommand: null,
    timeoutMs: 20000,
    memoryMb: 256,
    pidsLimit: 128,
  },
  "c++": {
    id: "c++",
    label: "C++",
    image: "code-sandbox-cpp",
    fileName: "main.cpp",
    runCommand: ["/tmp/a.out"],
    compileCommand: ["g++", "-O0", "main.cpp", "-o", "/tmp/a.out"],
    timeoutMs: 30000,
    memoryMb: 256,
  },
  go: {
    id: "go",
    label: "Go",
    image: "code-sandbox-go",
    fileName: "main.go",
    runCommand: ["/tmp/main"],
    compileCommand: ["go", "build", "-o", "/tmp/main", "main.go"],
    timeoutMs: 30000,
    memoryMb: 512,
    pidsLimit: 128,
    env: ["GOCACHE=/tmp/go-cache", "GOPATH=/tmp/gopath"],
  },
  rust: {
    id: "rust",
    label: "Rust",
    image: "code-sandbox-rust",
    fileName: "main.rs",
    runCommand: ["/tmp/main"],
    compileCommand: ["rustc", "main.rs", "-o", "/tmp/main"],
    timeoutMs: 60000,
    memoryMb: 512,
  },
};

export function normalizeLanguage(language = DEFAULT_LANGUAGE) {
  if (typeof language !== "string" || language.trim().length === 0) {
    return DEFAULT_LANGUAGE;
  }

  return language.trim().toLowerCase();
}

export function getLanguageConfig(language = DEFAULT_LANGUAGE) {
  const normalizedLanguage = normalizeLanguage(language);
  return LANGUAGES[normalizedLanguage] || null;
}