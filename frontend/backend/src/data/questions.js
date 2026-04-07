export const questionBank = [
  {
    qid: 1,
    title: "Banana Counter 3000",
    hint: "Count vowels, not your tears. 😄",
    difficulty: "easy",
    expectedTimeSeconds: 600,
    pythonCode: "s = input().strip().lower()\ncount = sum(1 for ch in s if ch in 'aeiou')\nprint(count)",
    testCases: [
      { stdin: "banana", expectedOutput: "3" },
      { stdin: "rhythm", expectedOutput: "0" },
      { stdin: "AEIOU", expectedOutput: "5" },
      { stdin: "code translation arena", expectedOutput: "9" },
      { stdin: "", expectedOutput: "0" }
    ]
  },
  {
    qid: 2,
    title: "Reverse Me Maybe",
    hint: "Slice like a ninja.",
    difficulty: "easy",
    expectedTimeSeconds: 600,
    pythonCode: "s = input().rstrip('\\n')\nprint(s[::-1])",
    testCases: [
      { stdin: "hello", expectedOutput: "olleh" },
      { stdin: "A", expectedOutput: "A" },
      { stdin: "", expectedOutput: "" },
      { stdin: "racecar", expectedOutput: "racecar" },
      { stdin: "12345", expectedOutput: "54321" }
    ]
  },
  {
    qid: 3,
    title: "Odd Squad",
    hint: "Print odd numbers up to n.",
    difficulty: "easy",
    expectedTimeSeconds: 650,
    pythonCode: "n = int(input())\nout = [str(i) for i in range(1, n + 1) if i % 2 == 1]\nprint(' '.join(out))",
    testCases: [
      { stdin: "1", expectedOutput: "1" },
      { stdin: "2", expectedOutput: "1" },
      { stdin: "10", expectedOutput: "1 3 5 7 9" },
      { stdin: "0", expectedOutput: "" },
      { stdin: "11", expectedOutput: "1 3 5 7 9 11" }
    ]
  },
  {
    qid: 4,
    title: "Sum of Digits Gym",
    hint: "Absolute value first.",
    difficulty: "easy",
    expectedTimeSeconds: 650,
    pythonCode: "n = abs(int(input()))\nprint(sum(int(ch) for ch in str(n)))",
    testCases: [
      { stdin: "123", expectedOutput: "6" },
      { stdin: "-99", expectedOutput: "18" },
      { stdin: "0", expectedOutput: "0" },
      { stdin: "1001", expectedOutput: "2" },
      { stdin: "99999", expectedOutput: "45" }
    ]
  },
  {
    qid: 5,
    title: "Factorial Fiesta",
    hint: "Loop it up.",
    difficulty: "easy",
    expectedTimeSeconds: 700,
    pythonCode: "n = int(input())\nans = 1\nfor i in range(2, n + 1):\n    ans *= i\nprint(ans)",
    testCases: [
      { stdin: "0", expectedOutput: "1" },
      { stdin: "1", expectedOutput: "1" },
      { stdin: "5", expectedOutput: "120" },
      { stdin: "7", expectedOutput: "5040" },
      { stdin: "10", expectedOutput: "3628800" }
    ]
  },
  {
    qid: 6,
    title: "Recursive Rabbit Fibonacci",
    hint: "Classic recursion challenge.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "def fib(n):\n    if n <= 1:\n        return n\n    return fib(n - 1) + fib(n - 2)\n\nn = int(input())\nprint(fib(n))",
    testCases: [
      { stdin: "0", expectedOutput: "0" },
      { stdin: "1", expectedOutput: "1" },
      { stdin: "6", expectedOutput: "8" },
      { stdin: "8", expectedOutput: "21" },
      { stdin: "10", expectedOutput: "55" }
    ]
  },
  {
    qid: 7,
    title: "Palindrome Police",
    hint: "Normalize lowercase.",
    difficulty: "easy",
    expectedTimeSeconds: 700,
    pythonCode: "s = input().strip().lower()\nprint('YES' if s == s[::-1] else 'NO')",
    testCases: [
      { stdin: "madam", expectedOutput: "YES" },
      { stdin: "Code", expectedOutput: "NO" },
      { stdin: "", expectedOutput: "YES" },
      { stdin: "level", expectedOutput: "YES" },
      { stdin: "hello", expectedOutput: "NO" }
    ]
  },
  {
    qid: 8,
    title: "Second Largest Drama",
    hint: "Distinct values only.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "arr = list(map(int, input().split()))\nuniq = sorted(set(arr))\nprint(uniq[-2] if len(uniq) >= 2 else -1)",
    testCases: [
      { stdin: "1 2 3 4", expectedOutput: "3" },
      { stdin: "5 5 5", expectedOutput: "-1" },
      { stdin: "9 1", expectedOutput: "1" },
      { stdin: "-1 -2 -3", expectedOutput: "-2" },
      { stdin: "10 9 10 8", expectedOutput: "9" }
    ]
  },
  {
    qid: 9,
    title: "FizzBuzz But Sleepy",
    hint: "If divisible by both, say FizzBuzz.",
    difficulty: "easy",
    expectedTimeSeconds: 800,
    pythonCode: "n = int(input())\nout = []\nfor i in range(1, n + 1):\n    if i % 15 == 0:\n        out.append('FizzBuzz')\n    elif i % 3 == 0:\n        out.append('Fizz')\n    elif i % 5 == 0:\n        out.append('Buzz')\n    else:\n        out.append(str(i))\nprint(' '.join(out))",
    testCases: [
      { stdin: "1", expectedOutput: "1" },
      { stdin: "3", expectedOutput: "1 2 Fizz" },
      { stdin: "5", expectedOutput: "1 2 Fizz 4 Buzz" },
      { stdin: "15", expectedOutput: "1 2 Fizz 4 Buzz Fizz 7 8 Fizz Buzz 11 Fizz 13 14 FizzBuzz" },
      { stdin: "0", expectedOutput: "" }
    ]
  },
  {
    qid: 10,
    title: "Anagram Detective",
    hint: "Sort the strings.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "a = input().strip().lower()\nb = input().strip().lower()\nprint('YES' if sorted(a) == sorted(b) else 'NO')",
    testCases: [
      { stdin: "listen\nsilent", expectedOutput: "YES" },
      { stdin: "evil\nvile", expectedOutput: "YES" },
      { stdin: "rat\ncar", expectedOutput: "NO" },
      { stdin: "\n", expectedOutput: "YES" },
      { stdin: "aabb\nbbaa", expectedOutput: "YES" }
    ]
  },
  {
    qid: 11,
    title: "Prime Time Trouble",
    hint: "Check up to sqrt(n).",
    difficulty: "medium",
    expectedTimeSeconds: 950,
    pythonCode: "import math\nn = int(input())\nif n < 2:\n    print('NO')\nelse:\n    ok = True\n    for i in range(2, int(math.sqrt(n)) + 1):\n        if n % i == 0:\n            ok = False\n            break\n    print('YES' if ok else 'NO')",
    testCases: [
      { stdin: "2", expectedOutput: "YES" },
      { stdin: "9", expectedOutput: "NO" },
      { stdin: "17", expectedOutput: "YES" },
      { stdin: "1", expectedOutput: "NO" },
      { stdin: "97", expectedOutput: "YES" }
    ]
  },
  {
    qid: 12,
    title: "Countdown Comedian",
    hint: "From n to 1.",
    difficulty: "easy",
    expectedTimeSeconds: 650,
    pythonCode: "n = int(input())\nprint(' '.join(str(i) for i in range(n, 0, -1)))",
    testCases: [
      { stdin: "1", expectedOutput: "1" },
      { stdin: "5", expectedOutput: "5 4 3 2 1" },
      { stdin: "0", expectedOutput: "" },
      { stdin: "3", expectedOutput: "3 2 1" },
      { stdin: "2", expectedOutput: "2 1" }
    ]
  },
  {
    qid: 13,
    title: "Duplicate Crusher",
    hint: "Preserve first occurrence order.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "arr = input().split()\nseen = set()\nout = []\nfor x in arr:\n    if x not in seen:\n        seen.add(x)\n        out.append(x)\nprint(' '.join(out))",
    testCases: [
      { stdin: "1 2 2 3 1", expectedOutput: "1 2 3" },
      { stdin: "a a a", expectedOutput: "a" },
      { stdin: "", expectedOutput: "" },
      { stdin: "x y z", expectedOutput: "x y z" },
      { stdin: "5 5 4 4 3", expectedOutput: "5 4 3" }
    ]
  },
  {
    qid: 14,
    title: "GCD Gladiator",
    hint: "Euclidean algorithm.",
    difficulty: "medium",
    expectedTimeSeconds: 850,
    pythonCode: "a, b = map(int, input().split())\nwhile b:\n    a, b = b, a % b\nprint(abs(a))",
    testCases: [
      { stdin: "12 18", expectedOutput: "6" },
      { stdin: "100 25", expectedOutput: "25" },
      { stdin: "7 13", expectedOutput: "1" },
      { stdin: "-24 36", expectedOutput: "12" },
      { stdin: "0 5", expectedOutput: "5" }
    ]
  },
  {
    qid: 15,
    title: "LCM Laser",
    hint: "LCM = abs(a*b)/gcd.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "import math\na, b = map(int, input().split())\nif a == 0 or b == 0:\n    print(0)\nelse:\n    print(abs(a * b) // math.gcd(a, b))",
    testCases: [
      { stdin: "4 6", expectedOutput: "12" },
      { stdin: "5 7", expectedOutput: "35" },
      { stdin: "0 9", expectedOutput: "0" },
      { stdin: "21 6", expectedOutput: "42" },
      { stdin: "-3 15", expectedOutput: "15" }
    ]
  },
  {
    qid: 16,
    title: "Word Frequency Wizard",
    hint: "Output max frequency count.",
    difficulty: "medium",
    expectedTimeSeconds: 950,
    pythonCode: "words = input().split()\nif not words:\n    print(0)\nelse:\n    freq = {}\n    for w in words:\n        freq[w] = freq.get(w, 0) + 1\n    print(max(freq.values()))",
    testCases: [
      { stdin: "hi hi bye", expectedOutput: "2" },
      { stdin: "a b c", expectedOutput: "1" },
      { stdin: "", expectedOutput: "0" },
      { stdin: "x x x x", expectedOutput: "4" },
      { stdin: "ab ab cd cd cd", expectedOutput: "3" }
    ]
  },
  {
    qid: 17,
    title: "Recursive Sum Ninja",
    hint: "Sum 1..n recursively.",
    difficulty: "medium",
    expectedTimeSeconds: 950,
    pythonCode: "def f(n):\n    if n <= 1:\n        return n\n    return n + f(n - 1)\n\nprint(f(int(input())))",
    testCases: [
      { stdin: "1", expectedOutput: "1" },
      { stdin: "5", expectedOutput: "15" },
      { stdin: "10", expectedOutput: "55" },
      { stdin: "0", expectedOutput: "0" },
      { stdin: "3", expectedOutput: "6" }
    ]
  },
  {
    qid: 18,
    title: "Merge and Sort Mischief",
    hint: "Two lines of ints.",
    difficulty: "easy",
    expectedTimeSeconds: 700,
    pythonCode: "import sys\nlines = [line.strip() for line in sys.stdin.read().splitlines()]\na = list(map(int, lines[0].split())) if len(lines) > 0 and lines[0] else []\nb = list(map(int, lines[1].split())) if len(lines) > 1 and lines[1] else []\narr = a + b\narr.sort()\nprint(' '.join(map(str, arr)))",
    testCases: [
      { stdin: "1 3 5\n2 4 6", expectedOutput: "1 2 3 4 5 6" },
      { stdin: "\n", expectedOutput: "" },
      { stdin: "9\n1", expectedOutput: "1 9" },
      { stdin: "-1 0\n-2 3", expectedOutput: "-2 -1 0 3" },
      { stdin: "5 5\n5", expectedOutput: "5 5 5" }
    ]
  },
  {
    qid: 19,
    title: "Bracket Balance Battle",
    hint: "Use a stack.",
    difficulty: "hard",
    expectedTimeSeconds: 1200,
    pythonCode: "s = input().strip()\nstack = []\npairs = {')': '(', ']': '[', '}': '{'}\nok = True\nfor ch in s:\n    if ch in '([{':\n        stack.append(ch)\n    elif ch in ')]}':\n        if not stack or stack[-1] != pairs[ch]:\n            ok = False\n            break\n        stack.pop()\nif stack:\n    ok = False\nprint('YES' if ok else 'NO')",
    testCases: [
      { stdin: "()[]{}", expectedOutput: "YES" },
      { stdin: "([{}])", expectedOutput: "YES" },
      { stdin: "([)]", expectedOutput: "NO" },
      { stdin: "((", expectedOutput: "NO" },
      { stdin: "", expectedOutput: "YES" }
    ]
  },
  {
    qid: 20,
    title: "Min-Max Duel",
    hint: "Print min and max.",
    difficulty: "easy",
    expectedTimeSeconds: 650,
    pythonCode: "arr = list(map(int, input().split()))\nif not arr:\n    print('0 0')\nelse:\n    print(min(arr), max(arr))",
    testCases: [
      { stdin: "1 2 3", expectedOutput: "1 3" },
      { stdin: "-5 -1 -3", expectedOutput: "-5 -1" },
      { stdin: "7", expectedOutput: "7 7" },
      { stdin: "", expectedOutput: "0 0" },
      { stdin: "9 9 9", expectedOutput: "9 9" }
    ]
  },
  {
    qid: 21,
    title: "Rotate Left One",
    hint: "First element goes to end.",
    difficulty: "easy",
    expectedTimeSeconds: 700,
    pythonCode: "arr = input().split()\nif len(arr) <= 1:\n    print(' '.join(arr))\nelse:\n    print(' '.join(arr[1:] + arr[:1]))",
    testCases: [
      { stdin: "1 2 3", expectedOutput: "2 3 1" },
      { stdin: "x", expectedOutput: "x" },
      { stdin: "", expectedOutput: "" },
      { stdin: "a b", expectedOutput: "b a" },
      { stdin: "5 5 5", expectedOutput: "5 5 5" }
    ]
  },
  {
    qid: 22,
    title: "Longest Word Wins",
    hint: "If tie, keep first.",
    difficulty: "easy",
    expectedTimeSeconds: 750,
    pythonCode: "words = input().split()\nif not words:\n    print('')\nelse:\n    best = words[0]\n    for w in words[1:]:\n        if len(w) > len(best):\n            best = w\n    print(best)",
    testCases: [
      { stdin: "i love coding", expectedOutput: "coding" },
      { stdin: "a bb ccc dd", expectedOutput: "ccc" },
      { stdin: "", expectedOutput: "" },
      { stdin: "same size", expectedOutput: "same" },
      { stdin: "neon cyberpunk arena", expectedOutput: "cyberpunk" }
    ]
  },
  {
    qid: 23,
    title: "Binary to Decimal Boom",
    hint: "Manual conversion.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "b = input().strip()\nvalue = 0\nfor ch in b:\n    value = value * 2 + int(ch)\nprint(value)",
    testCases: [
      { stdin: "0", expectedOutput: "0" },
      { stdin: "1", expectedOutput: "1" },
      { stdin: "1010", expectedOutput: "10" },
      { stdin: "111111", expectedOutput: "63" },
      { stdin: "100000", expectedOutput: "32" }
    ]
  },
  {
    qid: 24,
    title: "Decimal to Binary Blast",
    hint: "Handle zero carefully.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "n = int(input())\nif n == 0:\n    print('0')\nelse:\n    bits = []\n    x = n\n    while x > 0:\n        bits.append(str(x % 2))\n        x //= 2\n    print(''.join(reversed(bits)))",
    testCases: [
      { stdin: "0", expectedOutput: "0" },
      { stdin: "1", expectedOutput: "1" },
      { stdin: "10", expectedOutput: "1010" },
      { stdin: "32", expectedOutput: "100000" },
      { stdin: "63", expectedOutput: "111111" }
    ]
  },
  {
    qid: 25,
    title: "Unique Char Counter",
    hint: "Case-sensitive set size.",
    difficulty: "easy",
    expectedTimeSeconds: 700,
    pythonCode: "s = input().rstrip('\\n')\nprint(len(set(s)))",
    testCases: [
      { stdin: "hello", expectedOutput: "4" },
      { stdin: "aaaa", expectedOutput: "1" },
      { stdin: "", expectedOutput: "0" },
      { stdin: "Aa", expectedOutput: "2" },
      { stdin: "abcabc", expectedOutput: "3" }
    ]
  },
  {
    qid: 26,
    title: "Matrix Row Sum Rush",
    hint: "Two rows expected.",
    difficulty: "medium",
    expectedTimeSeconds: 950,
    pythonCode: "r1 = list(map(int, input().split()))\nr2 = list(map(int, input().split()))\nprint(sum(r1), sum(r2))",
    testCases: [
      { stdin: "1 2 3\n4 5 6", expectedOutput: "6 15" },
      { stdin: "0\n0", expectedOutput: "0 0" },
      { stdin: "-1 -2\n3 4", expectedOutput: "-3 7" },
      { stdin: "5 5 5\n1 1 1", expectedOutput: "15 3" },
      { stdin: "9\n8", expectedOutput: "9 8" }
    ]
  },
  {
    qid: 27,
    title: "Power Tower Lite",
    hint: "Compute a^b iteratively.",
    difficulty: "medium",
    expectedTimeSeconds: 900,
    pythonCode: "a, b = map(int, input().split())\nans = 1\nfor _ in range(b):\n    ans *= a\nprint(ans)",
    testCases: [
      { stdin: "2 3", expectedOutput: "8" },
      { stdin: "5 0", expectedOutput: "1" },
      { stdin: "3 4", expectedOutput: "81" },
      { stdin: "10 1", expectedOutput: "10" },
      { stdin: "1 100", expectedOutput: "1" }
    ]
  },
  {
    qid: 28,
    title: "Recursive Reverse String",
    hint: "Base case empty string.",
    difficulty: "hard",
    expectedTimeSeconds: 1200,
    pythonCode: "def rev(s):\n    if s == '':\n        return ''\n    return rev(s[1:]) + s[0]\n\nprint(rev(input().rstrip('\\n')))",
    testCases: [
      { stdin: "abc", expectedOutput: "cba" },
      { stdin: "a", expectedOutput: "a" },
      { stdin: "", expectedOutput: "" },
      { stdin: "level", expectedOutput: "level" },
      { stdin: "arena", expectedOutput: "anera" }
    ]
  },
  {
    qid: 29,
    title: "Missing Number Mystery",
    hint: "Numbers are 1..n with one missing.",
    difficulty: "medium",
    expectedTimeSeconds: 1000,
    pythonCode: "arr = list(map(int, input().split()))\nn = len(arr) + 1\nexpected = n * (n + 1) // 2\nprint(expected - sum(arr))",
    testCases: [
      { stdin: "1 2 4 5", expectedOutput: "3" },
      { stdin: "2 3 1 5", expectedOutput: "4" },
      { stdin: "1", expectedOutput: "2" },
      { stdin: "", expectedOutput: "1" },
      { stdin: "1 2 3 4 6 7", expectedOutput: "5" }
    ]
  },
  {
    qid: 30,
    title: "Traffic Light Logic",
    hint: "red stop, yellow wait, green go.",
    difficulty: "easy",
    expectedTimeSeconds: 650,
    pythonCode: "s = input().strip().lower()\nif s == 'red':\n    print('STOP')\nelif s == 'yellow':\n    print('WAIT')\nelif s == 'green':\n    print('GO')\nelse:\n    print('UNKNOWN')",
    testCases: [
      { stdin: "red", expectedOutput: "STOP" },
      { stdin: "yellow", expectedOutput: "WAIT" },
      { stdin: "green", expectedOutput: "GO" },
      { stdin: "blue", expectedOutput: "UNKNOWN" },
      { stdin: "GREEN", expectedOutput: "GO" }
    ]
  }
];
