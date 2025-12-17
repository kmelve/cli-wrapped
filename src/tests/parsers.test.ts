import { describe, expect, test } from "bun:test";
import { ZshParser } from "../parsers/zsh.ts";
import { BashParser } from "../parsers/bash.ts";
import { FishParser } from "../parsers/fish.ts";

describe("ZshParser", () => {
  const parser = new ZshParser();

  test("parses extended history format", () => {
    const content = `: 1704067200:0;git status
: 1704067260:0;ls -la
: 1704067320:0;cd projects`;

    const result = parser.parse(content);

    expect(result.length).toBe(3);
    expect(result[0]?.command).toBe("git status");
    expect(result[1]?.command).toBe("ls -la");
    expect(result[2]?.command).toBe("cd projects");
  });

  test("parses timestamps correctly", () => {
    const content = `: 1704067200:0;git status`;
    const result = parser.parse(content);

    expect(result[0]?.timestamp).toBeInstanceOf(Date);
    expect(result[0]?.timestamp?.getTime()).toBe(1704067200000);
  });

  test("handles simple history format (no timestamps)", () => {
    const content = `git status
ls -la
cd projects`;

    const result = parser.parse(content);

    expect(result.length).toBe(3);
    expect(result[0]?.command).toBe("git status");
  });

  test("handles multi-line commands", () => {
    const content = `: 1704067200:0;echo "hello\\
world"
: 1704067260:0;ls`;

    const result = parser.parse(content);

    expect(result.length).toBe(2);
  });

  test("handles empty lines", () => {
    const content = `: 1704067200:0;git status

: 1704067260:0;ls`;

    const result = parser.parse(content);

    expect(result.length).toBe(2);
  });
});

describe("BashParser", () => {
  const parser = new BashParser();

  test("parses simple history format", () => {
    const content = `git status
ls -la
cd projects`;

    const result = parser.parse(content);

    expect(result.length).toBe(3);
    expect(result[0]?.command).toBe("git status");
    expect(result[1]?.command).toBe("ls -la");
  });

  test("parses history with timestamps", () => {
    const content = `#1704067200
git status
#1704067260
ls -la`;

    const result = parser.parse(content);

    expect(result.length).toBe(2);
    expect(result[0]?.command).toBe("git status");
    expect(result[0]?.timestamp?.getTime()).toBe(1704067200000);
  });

  test("handles empty lines", () => {
    const content = `git status

ls -la`;

    const result = parser.parse(content);

    expect(result.length).toBe(2);
  });
});

describe("FishParser", () => {
  const parser = new FishParser();

  test("parses fish history format", () => {
    const content = `- cmd: git status
  when: 1704067200
- cmd: ls -la
  when: 1704067260`;

    const result = parser.parse(content);

    expect(result.length).toBe(2);
    expect(result[0]?.command).toBe("git status");
    expect(result[1]?.command).toBe("ls -la");
  });

  test("parses timestamps correctly", () => {
    const content = `- cmd: git status
  when: 1704067200`;

    const result = parser.parse(content);

    expect(result[0]?.timestamp?.getTime()).toBe(1704067200000);
  });

  test("handles paths array", () => {
    const content = `- cmd: cd /home/user
  when: 1704067200
  paths:
    - /home/user`;

    const result = parser.parse(content);

    expect(result.length).toBe(1);
    expect(result[0]?.command).toBe("cd /home/user");
  });
});
