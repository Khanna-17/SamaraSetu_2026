export const questionBank = [

{
  qid: 1,
  title: "Proxy Chain Reaction",
  hint: "Palindrome hidden inside numbers 👀",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def proxy_chain(n):
    def is_pal(x):
        return str(x) == str(x)[::-1]

    total = 0
    for i in range(1, n+1):
        temp = i
        while temp > 0:
            if is_pal(temp):
                total += 1
                break
            temp //= 10
    return total

print(proxy_chain(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "5", expectedOutput: "5" },
    { stdin: "9", expectedOutput: "9" },
    { stdin: "10", expectedOutput: "10" },
    { stdin: "11", expectedOutput: "11" },
    { stdin: "15", expectedOutput: "15" },
    { stdin: "20", expectedOutput: "20" },
    { stdin: "25", expectedOutput: "25" },
    { stdin: "50", expectedOutput: "50" },
    { stdin: "99", expectedOutput: "99" },
    { stdin: "100", expectedOutput: "100" },
    { stdin: "101", expectedOutput: "101" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "200", expectedOutput: "200" }
  ]
},

{
  qid: 2,
  title: "Infinite Snooze Logic",
  hint: "Reduce digits again and again 😴",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def snooze_loop(n):
    def digit_sum(x):
        s = 0
        while x:
            s += x % 10
            x //= 10
        return s

    count = 0
    while n >= 10:
        n = digit_sum(n)
        count += 1
    return n + count

print(snooze_loop(int(input())))`,
  testCases: [
    { stdin: "5", expectedOutput: "5" },
    { stdin: "10", expectedOutput: "2" },
    { stdin: "19", expectedOutput: "10" },
    { stdin: "99", expectedOutput: "10" },
    { stdin: "123", expectedOutput: "8" },
    { stdin: "456", expectedOutput: "7" },
    { stdin: "999", expectedOutput: "11" },
    { stdin: "9876", expectedOutput: "9" },
    { stdin: "111", expectedOutput: "4" },
    { stdin: "222", expectedOutput: "6" },
    { stdin: "100", expectedOutput: "2" },
    { stdin: "1000", expectedOutput: "2" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "88", expectedOutput: "16" }
  ]
},

{
  qid: 3,
  title: "Pizza Rotation Madness",
  hint: "Rotate digits like last slice 🍕",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def pizza_game(n, k):
    s = str(n)
    for _ in range(k):
        s = s[-1] + s[:-1]

    total = 0
    for ch in s:
        total += int(ch)
    return total

n, k = map(int, input().split())
print(pizza_game(n, k))`,
  testCases: [
    { stdin: "123 1", expectedOutput: "6" },
    { stdin: "123 2", expectedOutput: "6" },
    { stdin: "123 3", expectedOutput: "6" },
    { stdin: "987 2", expectedOutput: "24" },
    { stdin: "456 3", expectedOutput: "15" },
    { stdin: "10 1", expectedOutput: "1" },
    { stdin: "100 2", expectedOutput: "1" },
    { stdin: "5 10", expectedOutput: "5" },
    { stdin: "321 4", expectedOutput: "6" },
    { stdin: "222 2", expectedOutput: "6" },
    { stdin: "999 1", expectedOutput: "27" },
    { stdin: "789 5", expectedOutput: "24" },
    { stdin: "1 1", expectedOutput: "1" },
    { stdin: "0 5", expectedOutput: "0" },
    { stdin: "1000 3", expectedOutput: "1" }
  ]
},

{
  qid: 4,
  title: "Fake Study Planner",
  hint: "Squares vs cubes 📚",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def study_plan(n):
    even_sum = 0
    odd_sum = 0

    for i in range(1, n+1):
        if i % 2 == 0:
            even_sum += i * i
        else:
            odd_sum += i * i * i

    return even_sum - odd_sum

print(study_plan(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "-1" },
    { stdin: "2", expectedOutput: "3" },
    { stdin: "3", expectedOutput: "-24" },
    { stdin: "4", expectedOutput: "-8" },
    { stdin: "5", expectedOutput: "-133" },
    { stdin: "6", expectedOutput: "-97" },
    { stdin: "7", expectedOutput: "-440" },
    { stdin: "8", expectedOutput: "-376" },
    { stdin: "9", expectedOutput: "-1105" },
    { stdin: "10", expectedOutput: "-1005" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "11", expectedOutput: "-2316" },
    { stdin: "12", expectedOutput: "-2172" },
    { stdin: "13", expectedOutput: "-4169" },
    { stdin: "15", expectedOutput: "-9175" }
  ]
},

{
  qid: 5,
  title: "Group Project Survivor",
  hint: "XOR magic + extras 😭",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def survivor(arr):
    result = 0
    for num in arr:
        result ^= num

    extra = 0
    for num in arr:
        if num % 2 == 0:
            extra += num

    return result + extra

arr = list(map(int, input().split()))
print(survivor(arr))`,
  testCases: [
    { stdin: "2 3 2 4 4 6", expectedOutput: "15" },
    { stdin: "1 1 2 2", expectedOutput: "6" },
    { stdin: "5 5 5", expectedOutput: "5" },
    { stdin: "10 20 10", expectedOutput: "30" },
    { stdin: "7 7 7 7", expectedOutput: "0" },
    { stdin: "8 9 8 10", expectedOutput: "27" },
    { stdin: "2", expectedOutput: "4" },
    { stdin: "", expectedOutput: "0" },
    { stdin: "1 2 3", expectedOutput: "6" },
    { stdin: "6 6 6 6 6", expectedOutput: "6" },
    { stdin: "0 0", expectedOutput: "0" },
    { stdin: "4 4 5", expectedOutput: "13" },
    { stdin: "3 3 3 3 3", expectedOutput: "3" },
    { stdin: "2 4 6 8", expectedOutput: "20" },
    { stdin: "9 9 9", expectedOutput: "9" }
  ]
},

{
  qid: 6,
  title: "Maggi Cooking Simulation",
  hint: "Reduce number with steps 🍜",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def maggi_sim(n):
    steps = 0
    total = 0

    while n > 0:
        if n % 2 == 0:
            total += n
            n //= 2
        else:
            total += 1
            n -= 1
        steps += 1

    return total + steps

print(maggi_sim(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "4" },
    { stdin: "3", expectedOutput: "6" },
    { stdin: "4", expectedOutput: "9" },
    { stdin: "5", expectedOutput: "11" },
    { stdin: "6", expectedOutput: "14" },
    { stdin: "7", expectedOutput: "16" },
    { stdin: "10", expectedOutput: "26" },
    { stdin: "15", expectedOutput: "36" },
    { stdin: "20", expectedOutput: "46" },
    { stdin: "25", expectedOutput: "56" },
    { stdin: "30", expectedOutput: "66" },
    { stdin: "50", expectedOutput: "116" },
    { stdin: "100", expectedOutput: "216" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 7,
  title: "Playlist Chaos Engine",
  hint: "Reverse + alternate insert 🎧",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def playlist(arr):
    reversed_arr = arr[::-1]
    result = []

    for i in range(len(reversed_arr)):
        if i % 2 == 0:
            result.append(reversed_arr[i])
        else:
            result.insert(0, reversed_arr[i])

    return result

arr = list(map(int, input().split()))
print(*playlist(arr))`,
  testCases: [
    { stdin: "1 2 3 4", expectedOutput: "2 4 3 1" },
    { stdin: "1 2 3 4 5", expectedOutput: "4 2 5 3 1" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "", expectedOutput: "" },
    { stdin: "5 6 7 8 9 10", expectedOutput: "6 8 10 9 7 5" },
    { stdin: "2 4 6 8", expectedOutput: "4 8 6 2" },
    { stdin: "9 8 7 6 5", expectedOutput: "8 6 9 7 5" },
    { stdin: "3 3 3", expectedOutput: "3 3 3" },
    { stdin: "10 20", expectedOutput: "20 10" },
    { stdin: "11 22 33 44 55", expectedOutput: "22 44 55 33 11" },
    { stdin: "7 14 21", expectedOutput: "14 21 7" },
    { stdin: "100 200 300", expectedOutput: "200 300 100" },
    { stdin: "5 4 3 2 1", expectedOutput: "4 2 5 3 1" },
    { stdin: "0 0 0", expectedOutput: "0 0 0" },
    { stdin: "8", expectedOutput: "8" }
  ]
},

{
  qid: 8,
  title: "Classroom Shuffle Advanced",
  hint: "Add/remove pattern 🪑",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def classroom(n):
    result = []
    for i in range(1, n+1):
        if i % 3 != 0:
            result.append(i)
        else:
            if result:
                result.pop()
    return sum(result)

print(classroom(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "3" },
    { stdin: "3", expectedOutput: "1" },
    { stdin: "4", expectedOutput: "5" },
    { stdin: "5", expectedOutput: "10" },
    { stdin: "6", expectedOutput: "5" },
    { stdin: "7", expectedOutput: "12" },
    { stdin: "8", expectedOutput: "20" },
    { stdin: "9", expectedOutput: "12" },
    { stdin: "10", expectedOutput: "22" },
    { stdin: "15", expectedOutput: "35" },
    { stdin: "20", expectedOutput: "70" },
    { stdin: "25", expectedOutput: "105" },
    { stdin: "30", expectedOutput: "155" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 9,
  title: "Unlock Pattern Level 2",
  hint: "Bit count × digit sum 📱",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def unlock(n):
    count = 0
    temp = n

    while temp > 0:
        if temp & 1:
            count += 1
        temp >>= 1

    extra = 0
    while n > 0:
        extra += n % 10
        n //= 10

    return count * extra

print(unlock(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "3", expectedOutput: "6" },
    { stdin: "4", expectedOutput: "4" },
    { stdin: "5", expectedOutput: "10" },
    { stdin: "6", expectedOutput: "12" },
    { stdin: "7", expectedOutput: "21" },
    { stdin: "10", expectedOutput: "2" },
    { stdin: "15", expectedOutput: "30" },
    { stdin: "20", expectedOutput: "4" },
    { stdin: "25", expectedOutput: "14" },
    { stdin: "30", expectedOutput: "12" },
    { stdin: "50", expectedOutput: "10" },
    { stdin: "100", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 10,
  title: "Fries Sharing Disaster",
  hint: "Squares, cubes + reverse 🍟",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def fries(n):
    s = str(n)
    total = 0

    for ch in s:
        digit = int(ch)
        if digit % 2 == 0:
            total += digit ** 2
        else:
            total += digit ** 3

    rev = int(s[::-1])
    return total + rev

print(fries(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "6" },
    { stdin: "3", expectedOutput: "30" },
    { stdin: "4", expectedOutput: "20" },
    { stdin: "5", expectedOutput: "130" },
    { stdin: "10", expectedOutput: "2" },
    { stdin: "12", expectedOutput: "6" },
    { stdin: "123", expectedOutput: "174" },
    { stdin: "456", expectedOutput: "113" },
    { stdin: "789", expectedOutput: "1125" },
    { stdin: "111", expectedOutput: "114" },
    { stdin: "222", expectedOutput: "18" },
    { stdin: "909", expectedOutput: "1458" },
    { stdin: "100", expectedOutput: "2" },
    { stdin: "0", expectedOutput: "0" }
  ]
},
{
  qid: 11,
  title: "Backbencher Strategy",
  hint: "Squares + bonus logic 😎",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def backbench_strategy(n):
    total = 0
    bonus = 0

    for i in range(n):
        if i % 3 == 1:
            total += i * i
        elif i % 3 == 2:
            bonus += i

    return total + bonus

print(backbench_strategy(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "1" },
    { stdin: "3", expectedOutput: "3" },
    { stdin: "4", expectedOutput: "10" },
    { stdin: "5", expectedOutput: "14" },
    { stdin: "6", expectedOutput: "39" },
    { stdin: "7", expectedOutput: "45" },
    { stdin: "8", expectedOutput: "94" },
    { stdin: "10", expectedOutput: "117" },
    { stdin: "15", expectedOutput: "275" },
    { stdin: "20", expectedOutput: "610" },
    { stdin: "25", expectedOutput: "1040" },
    { stdin: "30", expectedOutput: "1665" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "50", expectedOutput: "10450" }
  ]
},

{
  qid: 12,
  title: "Gaming XP Booster",
  hint: "Modulo + bonus XP 🎮",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def xp_boost(n):
    total = 0
    extra = 1

    for i in range(1, n+1):
        val = (i * i) % 7
        total += val

        if val % 2 == 0:
            extra += val

    return total + extra

print(xp_boost(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "7" },
    { stdin: "3", expectedOutput: "12" },
    { stdin: "4", expectedOutput: "20" },
    { stdin: "5", expectedOutput: "28" },
    { stdin: "6", expectedOutput: "42" },
    { stdin: "7", expectedOutput: "43" },
    { stdin: "8", expectedOutput: "51" },
    { stdin: "10", expectedOutput: "73" },
    { stdin: "15", expectedOutput: "121" },
    { stdin: "20", expectedOutput: "171" },
    { stdin: "25", expectedOutput: "221" },
    { stdin: "30", expectedOutput: "271" },
    { stdin: "0", expectedOutput: "1" },
    { stdin: "50", expectedOutput: "471" }
  ]
},

{
  qid: 13,
  title: "Chai Pattern Extended",
  hint: "Build number + sum ☕",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def chai_pattern(n):
    res = ""
    total = 0

    for i in range(1, n+1):
        digit = i % 3
        res += str(digit)
        total += digit

    return int(res) + total

print(chai_pattern(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "14" },
    { stdin: "3", expectedOutput: "15" },
    { stdin: "4", expectedOutput: "122" },
    { stdin: "5", expectedOutput: "1234" },
    { stdin: "6", expectedOutput: "1206" },
    { stdin: "7", expectedOutput: "12082" },
    { stdin: "8", expectedOutput: "120824" },
    { stdin: "9", expectedOutput: "120825" },
    { stdin: "10", expectedOutput: "1208252" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "11", expectedOutput: "12082524" },
    { stdin: "12", expectedOutput: "12082526" },
    { stdin: "13", expectedOutput: "120825262" },
    { stdin: "15", expectedOutput: "1208252625" }
  ]
},

{
  qid: 14,
  title: "Brain XOR Chaos",
  hint: "XOR pattern + extras 🧠",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def brain_lag(n):
    s = 0
    temp = n

    while temp > 0:
        s ^= temp
        temp -= 1

    extra = 0
    for i in range(n):
        extra += i % 2

    return s + extra

print(brain_lag(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "3" },
    { stdin: "3", expectedOutput: "3" },
    { stdin: "4", expectedOutput: "6" },
    { stdin: "5", expectedOutput: "6" },
    { stdin: "6", expectedOutput: "7" },
    { stdin: "7", expectedOutput: "7" },
    { stdin: "8", expectedOutput: "12" },
    { stdin: "10", expectedOutput: "15" },
    { stdin: "15", expectedOutput: "24" },
    { stdin: "20", expectedOutput: "30" },
    { stdin: "25", expectedOutput: "37" },
    { stdin: "30", expectedOutput: "45" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "50", expectedOutput: "75" }
  ]
},

{
  qid: 15,
  title: "Assignment Shuffle Pro",
  hint: "Insert + append chaos 📚",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def assignment_shuffle(n):
    res = []

    for i in range(1, n+1):
        if i % 2 == 0:
            res.insert(0, i)
        else:
            res.append(i)

    total = 0
    for x in res:
        total += x

    print(*res)
    print(total)

assignment_shuffle(int(input()))`,
  testCases: [
    { stdin: "1", expectedOutput: "1\n1" },
    { stdin: "2", expectedOutput: "2 1\n3" },
    { stdin: "3", expectedOutput: "2 1 3\n6" },
    { stdin: "4", expectedOutput: "4 2 1 3\n10" },
    { stdin: "5", expectedOutput: "4 2 1 3 5\n15" },
    { stdin: "6", expectedOutput: "6 4 2 1 3 5\n21" },
    { stdin: "7", expectedOutput: "6 4 2 1 3 5 7\n28" },
    { stdin: "8", expectedOutput: "8 6 4 2 1 3 5 7\n36" },
    { stdin: "10", expectedOutput: "10 8 6 4 2 1 3 5 7 9\n55" },
    { stdin: "0", expectedOutput: "\n0" },
    { stdin: "11", expectedOutput: "10 8 6 4 2 1 3 5 7 9 11\n66" },
    { stdin: "12", expectedOutput: "12 10 8 6 4 2 1 3 5 7 9 11\n78" },
    { stdin: "13", expectedOutput: "12 10 8 6 4 2 1 3 5 7 9 11 13\n91" },
    { stdin: "15", expectedOutput: "14 12 10 8 6 4 2 1 3 5 7 9 11 13 15\n120" },
    { stdin: "20", expectedOutput: "20 18 16 14 12 10 8 6 4 2 1 3 5 7 9 11 13 15 17 19\n210" }
  ]
},
{
  qid: 16,
  title: "Pizza Spiral Advanced",
  hint: "Total vs alternate subtraction 🍕",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def pizza_spiral(n):
    total = 0
    alt = 0

    for i in range(n):
        val = i * (i + 1)
        total += val
        if i % 2 == 0:
            alt += val

    return total - alt

print(pizza_spiral(int(input())))`,
  testCases: [
    { stdin: "0", expectedOutput: "0" },
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "3", expectedOutput: "2" },
    { stdin: "4", expectedOutput: "14" },
    { stdin: "5", expectedOutput: "14" },
    { stdin: "6", expectedOutput: "44" },
    { stdin: "7", expectedOutput: "44" },
    { stdin: "8", expectedOutput: "100" },
    { stdin: "10", expectedOutput: "190" },
    { stdin: "12", expectedOutput: "330" },
    { stdin: "15", expectedOutput: "560" },
    { stdin: "20", expectedOutput: "1330" },
    { stdin: "25", expectedOutput: "2600" },
    { stdin: "30", expectedOutput: "4550" }
  ]
},

{
  qid: 17,
  title: "Snooze Reduction Pro",
  hint: "Binary reduction with tracking 😴",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def snooze_pro(n):
    count = 0
    total = 0

    while n > 1:
        if n % 2 == 0:
            total += n
            n //= 2
        else:
            total += 1
            n -= 1
        count += 1

    return total + count

print(snooze_pro(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "3" },
    { stdin: "3", expectedOutput: "5" },
    { stdin: "4", expectedOutput: "8" },
    { stdin: "5", expectedOutput: "10" },
    { stdin: "6", expectedOutput: "13" },
    { stdin: "7", expectedOutput: "15" },
    { stdin: "10", expectedOutput: "24" },
    { stdin: "15", expectedOutput: "34" },
    { stdin: "20", expectedOutput: "44" },
    { stdin: "25", expectedOutput: "54" },
    { stdin: "30", expectedOutput: "64" },
    { stdin: "50", expectedOutput: "114" },
    { stdin: "100", expectedOutput: "214" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 18,
  title: "Music Digit Chaos",
  hint: "Sum + product of digits 🎧",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def music_logic(n):
    sq = n * n
    total = 0
    product = 1

    for d in str(sq):
        digit = int(d)
        total += digit
        product *= digit if digit != 0 else 1

    return total + product

print(music_logic(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "6" },
    { stdin: "3", expectedOutput: "12" },
    { stdin: "4", expectedOutput: "13" },
    { stdin: "5", expectedOutput: "12" },
    { stdin: "6", expectedOutput: "15" },
    { stdin: "7", expectedOutput: "22" },
    { stdin: "8", expectedOutput: "26" },
    { stdin: "9", expectedOutput: "18" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "11", expectedOutput: "6" },
    { stdin: "12", expectedOutput: "19" },
    { stdin: "15", expectedOutput: "18" },
    { stdin: "20", expectedOutput: "4" },
    { stdin: "25", expectedOutput: "20" }
  ]
},

{
  qid: 19,
  title: "Lab Experiment Extended",
  hint: "Half increments + bonus 🧪",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def lab_exp(n):
    res = 1
    extra = 0

    for i in range(1, n+1):
        val = i // 2
        res += val

        if val % 2 == 0:
            extra += val

    return res + extra

print(lab_exp(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "3", expectedOutput: "3" },
    { stdin: "4", expectedOutput: "6" },
    { stdin: "5", expectedOutput: "7" },
    { stdin: "6", expectedOutput: "12" },
    { stdin: "7", expectedOutput: "13" },
    { stdin: "8", expectedOutput: "20" },
    { stdin: "10", expectedOutput: "32" },
    { stdin: "12", expectedOutput: "52" },
    { stdin: "15", expectedOutput: "82" },
    { stdin: "20", expectedOutput: "142" },
    { stdin: "25", expectedOutput: "222" },
    { stdin: "30", expectedOutput: "332" },
    { stdin: "0", expectedOutput: "1" }
  ]
},

{
  qid: 20,
  title: "Group Division Advanced",
  hint: "Count + sum of divisors 🧑‍🤝‍🧑",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def group_division(n):
    count = 0
    total = 0

    for i in range(2, n):
        if n % i == 0:
            count += 1
            total += i

    print(count, total)

group_division(int(input()))`,
  testCases: [
    { stdin: "1", expectedOutput: "0 0" },
    { stdin: "2", expectedOutput: "0 0" },
    { stdin: "3", expectedOutput: "0 0" },
    { stdin: "4", expectedOutput: "1 2" },
    { stdin: "5", expectedOutput: "0 0" },
    { stdin: "6", expectedOutput: "2 5" },
    { stdin: "8", expectedOutput: "2 6" },
    { stdin: "9", expectedOutput: "1 3" },
    { stdin: "10", expectedOutput: "2 7" },
    { stdin: "12", expectedOutput: "4 16" },
    { stdin: "15", expectedOutput: "2 8" },
    { stdin: "20", expectedOutput: "4 21" },
    { stdin: "25", expectedOutput: "1 5" },
    { stdin: "30", expectedOutput: "6 72" },
    { stdin: "50", expectedOutput: "4 57" }
  ]
},
{
  qid: 16,
  title: "Pizza Spiral Advanced",
  hint: "Total vs alternate subtraction 🍕",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def pizza_spiral(n):
    total = 0
    alt = 0

    for i in range(n):
        val = i * (i + 1)
        total += val
        if i % 2 == 0:
            alt += val

    return total - alt

print(pizza_spiral(int(input())))`,
  testCases: [
    { stdin: "0", expectedOutput: "0" },
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "3", expectedOutput: "2" },
    { stdin: "4", expectedOutput: "14" },
    { stdin: "5", expectedOutput: "14" },
    { stdin: "6", expectedOutput: "44" },
    { stdin: "7", expectedOutput: "44" },
    { stdin: "8", expectedOutput: "100" },
    { stdin: "10", expectedOutput: "190" },
    { stdin: "12", expectedOutput: "330" },
    { stdin: "15", expectedOutput: "560" },
    { stdin: "20", expectedOutput: "1330" },
    { stdin: "25", expectedOutput: "2600" },
    { stdin: "30", expectedOutput: "4550" }
  ]
},

{
  qid: 17,
  title: "Snooze Reduction Pro",
  hint: "Binary reduction with tracking 😴",
  difficulty: "medium",
  expectedTimeSeconds: 950,
  pythonCode:
`def snooze_pro(n):
    count = 0
    total = 0

    while n > 1:
        if n % 2 == 0:
            total += n
            n //= 2
        else:
            total += 1
            n -= 1
        count += 1

    return total + count

print(snooze_pro(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "3" },
    { stdin: "3", expectedOutput: "5" },
    { stdin: "4", expectedOutput: "8" },
    { stdin: "5", expectedOutput: "10" },
    { stdin: "6", expectedOutput: "13" },
    { stdin: "7", expectedOutput: "15" },
    { stdin: "10", expectedOutput: "24" },
    { stdin: "15", expectedOutput: "34" },
    { stdin: "20", expectedOutput: "44" },
    { stdin: "25", expectedOutput: "54" },
    { stdin: "30", expectedOutput: "64" },
    { stdin: "50", expectedOutput: "114" },
    { stdin: "100", expectedOutput: "214" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 18,
  title: "Music Digit Chaos",
  hint: "Sum + product of digits 🎧",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def music_logic(n):
    sq = n * n
    total = 0
    product = 1

    for d in str(sq):
        digit = int(d)
        total += digit
        product *= digit if digit != 0 else 1

    return total + product

print(music_logic(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "6" },
    { stdin: "3", expectedOutput: "12" },
    { stdin: "4", expectedOutput: "13" },
    { stdin: "5", expectedOutput: "12" },
    { stdin: "6", expectedOutput: "15" },
    { stdin: "7", expectedOutput: "22" },
    { stdin: "8", expectedOutput: "26" },
    { stdin: "9", expectedOutput: "18" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "11", expectedOutput: "6" },
    { stdin: "12", expectedOutput: "19" },
    { stdin: "15", expectedOutput: "18" },
    { stdin: "20", expectedOutput: "4" },
    { stdin: "25", expectedOutput: "20" }
  ]
},

{
  qid: 19,
  title: "Lab Experiment Extended",
  hint: "Half increments + bonus 🧪",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def lab_exp(n):
    res = 1
    extra = 0

    for i in range(1, n+1):
        val = i // 2
        res += val

        if val % 2 == 0:
            extra += val

    return res + extra

print(lab_exp(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "3", expectedOutput: "3" },
    { stdin: "4", expectedOutput: "6" },
    { stdin: "5", expectedOutput: "7" },
    { stdin: "6", expectedOutput: "12" },
    { stdin: "7", expectedOutput: "13" },
    { stdin: "8", expectedOutput: "20" },
    { stdin: "10", expectedOutput: "32" },
    { stdin: "12", expectedOutput: "52" },
    { stdin: "15", expectedOutput: "82" },
    { stdin: "20", expectedOutput: "142" },
    { stdin: "25", expectedOutput: "222" },
    { stdin: "30", expectedOutput: "332" },
    { stdin: "0", expectedOutput: "1" }
  ]
},

{
  qid: 20,
  title: "Group Division Advanced",
  hint: "Count + sum of divisors 🧑‍🤝‍🧑",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def group_division(n):
    count = 0
    total = 0

    for i in range(2, n):
        if n % i == 0:
            count += 1
            total += i

    print(count, total)

group_division(int(input()))`,
  testCases: [
    { stdin: "1", expectedOutput: "0 0" },
    { stdin: "2", expectedOutput: "0 0" },
    { stdin: "3", expectedOutput: "0 0" },
    { stdin: "4", expectedOutput: "1 2" },
    { stdin: "5", expectedOutput: "0 0" },
    { stdin: "6", expectedOutput: "2 5" },
    { stdin: "8", expectedOutput: "2 6" },
    { stdin: "9", expectedOutput: "1 3" },
    { stdin: "10", expectedOutput: "2 7" },
    { stdin: "12", expectedOutput: "4 16" },
    { stdin: "15", expectedOutput: "2 8" },
    { stdin: "20", expectedOutput: "4 21" },
    { stdin: "25", expectedOutput: "1 5" },
    { stdin: "30", expectedOutput: "6 72" },
    { stdin: "50", expectedOutput: "4 57" }
  ]
},
{
  qid: 21,
  title: "Seat Filter Extended",
  hint: "Even index keep, odd remove 🪑",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def seat_filter(n):
    arr = []
    for i in range(1, n+1):
        arr.append(i)

    result = []
    removed = 0

    for i in range(len(arr)):
        if i % 2 == 0:
            result.append(arr[i])
        else:
            removed += arr[i]

    print(*result)
    print(removed)

seat_filter(int(input()))`,
  testCases: [
    { stdin: "1", expectedOutput: "1\n0" },
    { stdin: "2", expectedOutput: "1\n2" },
    { stdin: "3", expectedOutput: "1 3\n2" },
    { stdin: "4", expectedOutput: "1 3\n6" },
    { stdin: "5", expectedOutput: "1 3 5\n6" },
    { stdin: "6", expectedOutput: "1 3 5\n12" },
    { stdin: "7", expectedOutput: "1 3 5 7\n12" },
    { stdin: "8", expectedOutput: "1 3 5 7\n20" },
    { stdin: "10", expectedOutput: "1 3 5 7 9\n25" },
    { stdin: "12", expectedOutput: "1 3 5 7 9 11\n36" },
    { stdin: "15", expectedOutput: "1 3 5 7 9 11 13 15\n56" },
    { stdin: "20", expectedOutput: "1 3 5 7 9 11 13 15 17 19\n100" },
    { stdin: "25", expectedOutput: "1 3 5 7 9 11 13 15 17 19 21 23 25\n156" },
    { stdin: "30", expectedOutput: "1 3 5 7 9 11 13 15 17 19 21 23 25 27 29\n225" },
    { stdin: "0", expectedOutput: "\n0" }
  ]
},

{
  qid: 22,
  title: "Binary Pattern Advanced",
  hint: "Count 1s × length 📱",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def binary_pattern(n):
    binary = bin(n)[2:]
    ones = 0

    for ch in binary:
        if ch == '1':
            ones += 1

    length = len(str(n))
    return ones * length + len(binary)

print(binary_pattern(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "3" },
    { stdin: "3", expectedOutput: "5" },
    { stdin: "4", expectedOutput: "4" },
    { stdin: "5", expectedOutput: "6" },
    { stdin: "6", expectedOutput: "7" },
    { stdin: "7", expectedOutput: "9" },
    { stdin: "8", expectedOutput: "5" },
    { stdin: "10", expectedOutput: "6" },
    { stdin: "15", expectedOutput: "10" },
    { stdin: "20", expectedOutput: "7" },
    { stdin: "25", expectedOutput: "8" },
    { stdin: "30", expectedOutput: "9" },
    { stdin: "50", expectedOutput: "10" },
    { stdin: "100", expectedOutput: "8" }
  ]
},

{
  qid: 23,
  title: "Fries Rotation Extended",
  hint: "Rotate + sum 🍟",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def fries_rotate(n):
    s = str(n)
    rotated = s[1:] + s[0]

    total = 0
    for d in rotated:
        total += int(d)

    return int(rotated) + total

print(fries_rotate(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "12", expectedOutput: "23" },
    { stdin: "123", expectedOutput: "234" },
    { stdin: "456", expectedOutput: "564" },
    { stdin: "789", expectedOutput: "906" },
    { stdin: "100", expectedOutput: "1" },
    { stdin: "111", expectedOutput: "114" },
    { stdin: "222", expectedOutput: "228" },
    { stdin: "909", expectedOutput: "108" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "5", expectedOutput: "10" },
    { stdin: "321", expectedOutput: "216" },
    { stdin: "654", expectedOutput: "465" },
    { stdin: "987", expectedOutput: "879" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 24,
  title: "Cool Multiples Advanced",
  hint: "Multiples of 5 & 7 😎",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def cool_numbers(n):
    total = 0
    extra = 0

    for i in range(n):
        if i % 5 == 0 or i % 7 == 0:
            total += i
            if i % 2 == 0:
                extra += i

    return total + extra

print(cool_numbers(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "5", expectedOutput: "0" },
    { stdin: "10", expectedOutput: "15" },
    { stdin: "15", expectedOutput: "40" },
    { stdin: "20", expectedOutput: "90" },
    { stdin: "25", expectedOutput: "140" },
    { stdin: "30", expectedOutput: "240" },
    { stdin: "40", expectedOutput: "400" },
    { stdin: "50", expectedOutput: "650" },
    { stdin: "60", expectedOutput: "950" },
    { stdin: "70", expectedOutput: "1400" },
    { stdin: "80", expectedOutput: "1800" },
    { stdin: "90", expectedOutput: "2500" },
    { stdin: "100", expectedOutput: "3100" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 25,
  title: "Score Multiplier Pro",
  hint: "Index-based scoring 🎮",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def score_calc(arr):
    total = 0
    alt = 0

    for i in range(len(arr)):
        val = arr[i] * i
        total += val

        if i % 2 == 0:
            alt += val

    return total - alt

arr = list(map(int, input().split()))
print(score_calc(arr))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "1 2", expectedOutput: "2" },
    { stdin: "1 2 3", expectedOutput: "2" },
    { stdin: "1 2 3 4", expectedOutput: "10" },
    { stdin: "5 5 5", expectedOutput: "5" },
    { stdin: "2 4 6 8", expectedOutput: "20" },
    { stdin: "10 20 30", expectedOutput: "20" },
    { stdin: "1 3 5 7 9", expectedOutput: "40" },
    { stdin: "0 0 0", expectedOutput: "0" },
    { stdin: "9 8 7 6", expectedOutput: "32" },
    { stdin: "2 2 2 2 2", expectedOutput: "8" },
    { stdin: "3 6 9", expectedOutput: "6" },
    { stdin: "4 8 12", expectedOutput: "8" },
    { stdin: "1 1 1 1 1 1", expectedOutput: "9" },
    { stdin: "", expectedOutput: "0" }
  ]
},
{
  qid: 26,
  title: "Tea Cube Extended",
  hint: "Cube + digit magic ☕",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def tea_cube(n):
    cube = n**3
    total = 0
    extra = 1

    for d in str(cube):
        digit = int(d)
        total += digit
        if digit % 2 == 0:
            extra *= digit if digit != 0 else 1

    return total + extra

print(tea_cube(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "10" },
    { stdin: "3", expectedOutput: "12" },
    { stdin: "4", expectedOutput: "21" },
    { stdin: "5", expectedOutput: "18" },
    { stdin: "6", expectedOutput: "27" },
    { stdin: "7", expectedOutput: "46" },
    { stdin: "8", expectedOutput: "70" },
    { stdin: "9", expectedOutput: "54" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "11", expectedOutput: "10" },
    { stdin: "12", expectedOutput: "19" },
    { stdin: "15", expectedOutput: "36" },
    { stdin: "20", expectedOutput: "16" },
    { stdin: "0", expectedOutput: "1" }
  ]
},

{
  qid: 27,
  title: "Study Chaos Pro",
  hint: "Odd add, even subtract 📚",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def study_chaos(n):
    total = 0
    penalty = 0

    for i in range(1, n+1):
        if i % 2:
            total += i
        else:
            val = i * i
            total -= val
            penalty += val

    return total + penalty

print(study_chaos(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "1" },
    { stdin: "3", expectedOutput: "4" },
    { stdin: "4", expectedOutput: "4" },
    { stdin: "5", expectedOutput: "9" },
    { stdin: "6", expectedOutput: "9" },
    { stdin: "7", expectedOutput: "16" },
    { stdin: "8", expectedOutput: "16" },
    { stdin: "10", expectedOutput: "25" },
    { stdin: "12", expectedOutput: "36" },
    { stdin: "15", expectedOutput: "64" },
    { stdin: "20", expectedOutput: "100" },
    { stdin: "25", expectedOutput: "169" },
    { stdin: "30", expectedOutput: "225" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 28,
  title: "Reverse Difference Extended",
  hint: "Reverse + digit sum 🧠",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def reverse_diff(n):
    s = str(n)
    rev = int(s[::-1])

    diff = rev - n
    total = 0

    for d in s:
        total += int(d)

    return diff + total

print(reverse_diff(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "12", expectedOutput: "12" },
    { stdin: "123", expectedOutput: "213" },
    { stdin: "321", expectedOutput: "-198" },
    { stdin: "111", expectedOutput: "3" },
    { stdin: "101", expectedOutput: "2" },
    { stdin: "456", expectedOutput: "249" },
    { stdin: "789", expectedOutput: "288" },
    { stdin: "100", expectedOutput: "1" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "99", expectedOutput: "18" },
    { stdin: "909", expectedOutput: "18" },
    { stdin: "222", expectedOutput: "6" },
    { stdin: "1000", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 29,
  title: "Palindrome Counter Pro",
  hint: "Count & sum palindromes 🍕",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def palindrome_count(n):
    count = 0
    total = 0

    for i in range(1, n+1):
        if str(i) == str(i)[::-1]:
            count += 1
            total += i

    print(count, total)

palindrome_count(int(input()))`,
  testCases: [
    { stdin: "1", expectedOutput: "1 1" },
    { stdin: "5", expectedOutput: "5 15" },
    { stdin: "10", expectedOutput: "9 45" },
    { stdin: "11", expectedOutput: "10 56" },
    { stdin: "20", expectedOutput: "10 56" },
    { stdin: "25", expectedOutput: "11 77" },
    { stdin: "30", expectedOutput: "11 77" },
    { stdin: "50", expectedOutput: "13 159" },
    { stdin: "100", expectedOutput: "18 540" },
    { stdin: "9", expectedOutput: "9 45" },
    { stdin: "2", expectedOutput: "2 3" },
    { stdin: "15", expectedOutput: "10 56" },
    { stdin: "99", expectedOutput: "18 540" },
    { stdin: "101", expectedOutput: "19 641" },
    { stdin: "0", expectedOutput: "0 0" }
  ]
},

{
  qid: 30,
  title: "Sleep Pattern Extended",
  hint: "Pattern + extra sum 😴",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def sleep_pattern(n):
    res = 0
    extra = 0

    for i in range(n):
        val = (i % 2) * (i % 3)
        res += val

        if val > 0:
            extra += i

    return res + extra

print(sleep_pattern(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "1" },
    { stdin: "3", expectedOutput: "1" },
    { stdin: "4", expectedOutput: "5" },
    { stdin: "5", expectedOutput: "9" },
    { stdin: "6", expectedOutput: "9" },
    { stdin: "7", expectedOutput: "16" },
    { stdin: "8", expectedOutput: "24" },
    { stdin: "10", expectedOutput: "35" },
    { stdin: "12", expectedOutput: "54" },
    { stdin: "15", expectedOutput: "84" },
    { stdin: "20", expectedOutput: "140" },
    { stdin: "25", expectedOutput: "210" },
    { stdin: "30", expectedOutput: "300" },
    { stdin: "0", expectedOutput: "0" }
  ]
},
{
  qid: 31,
  title: "Digit Alternate Sum",
  hint: "Add-subtract alternate digits 🔢",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def alt(n):
    s = str(n)
    total = 0

    for i in range(len(s)):
        if i % 2 == 0:
            total += int(s[i])
        else:
            total -= int(s[i])

    return total

print(alt(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "12", expectedOutput: "-1" },
    { stdin: "123", expectedOutput: "2" },
    { stdin: "1234", expectedOutput: "-2" },
    { stdin: "5555", expectedOutput: "0" },
    { stdin: "999", expectedOutput: "9" },
    { stdin: "1010", expectedOutput: "0" },
    { stdin: "2222", expectedOutput: "0" },
    { stdin: "98765", expectedOutput: "9" },
    { stdin: "11111", expectedOutput: "1" },
    { stdin: "13579", expectedOutput: "5" },
    { stdin: "2468", expectedOutput: "-4" },
    { stdin: "1001", expectedOutput: "0" },
    { stdin: "9090", expectedOutput: "0" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 32,
  title: "Number Collapse",
  hint: "Reduce until single digit 🔥",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def collapse(n):
    while n >= 10:
        n = sum(int(d) for d in str(n))
    return n

print(collapse(int(input())))`,
  testCases: [
    { stdin: "9", expectedOutput: "9" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "99", expectedOutput: "9" },
    { stdin: "123", expectedOutput: "6" },
    { stdin: "9999", expectedOutput: "9" },
    { stdin: "111", expectedOutput: "3" },
    { stdin: "222", expectedOutput: "6" },
    { stdin: "456", expectedOutput: "6" },
    { stdin: "789", expectedOutput: "6" },
    { stdin: "1000", expectedOutput: "1" },
    { stdin: "1001", expectedOutput: "2" },
    { stdin: "8888", expectedOutput: "5" },
    { stdin: "12345", expectedOutput: "6" },
    { stdin: "999999", expectedOutput: "9" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 33,
  title: "Odd Even Builder",
  hint: "Even vs odd transformation 🧱",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def build(n):
    res = []
    for i in range(n):
        if i % 2:
            res.append(i*i)
        else:
            res.append(i+1)
    print(*res)

build(int(input()))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "1 1" },
    { stdin: "3", expectedOutput: "1 1 3" },
    { stdin: "4", expectedOutput: "1 1 3 9" },
    { stdin: "5", expectedOutput: "1 1 3 9 5" },
    { stdin: "6", expectedOutput: "1 1 3 9 5 25" },
    { stdin: "7", expectedOutput: "1 1 3 9 5 25 7" },
    { stdin: "8", expectedOutput: "1 1 3 9 5 25 7 49" },
    { stdin: "10", expectedOutput: "1 1 3 9 5 25 7 49 9 81" },
    { stdin: "12", expectedOutput: "1 1 3 9 5 25 7 49 9 81 11 121" },
    { stdin: "0", expectedOutput: "" },
    { stdin: "15", expectedOutput: "1 1 3 9 5 25 7 49 9 81 11 121 13 169 15" },
    { stdin: "20", expectedOutput: "1 1 3 9 5 25 7 49 9 81 11 121 13 169 15 225 17 289 19 361" },
    { stdin: "3", expectedOutput: "1 1 3" },
    { stdin: "2", expectedOutput: "1 1" }
  ]
},

{
  qid: 34,
  title: "Hidden Squares",
  hint: "Ends with 5 trick 🎯",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def hidden(n):
    return sum(i*i for i in range(n) if str(i).endswith('5'))

print(hidden(int(input())))`,
  testCases: [
    { stdin: "5", expectedOutput: "0" },
    { stdin: "10", expectedOutput: "25" },
    { stdin: "15", expectedOutput: "25" },
    { stdin: "20", expectedOutput: "250" },
    { stdin: "25", expectedOutput: "250" },
    { stdin: "30", expectedOutput: "875" },
    { stdin: "35", expectedOutput: "875" },
    { stdin: "40", expectedOutput: "1875" },
    { stdin: "50", expectedOutput: "1875" },
    { stdin: "60", expectedOutput: "3500" },
    { stdin: "70", expectedOutput: "3500" },
    { stdin: "80", expectedOutput: "6125" },
    { stdin: "90", expectedOutput: "6125" },
    { stdin: "100", expectedOutput: "10125" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 35,
  title: "Jump Logic",
  hint: "Dynamic reduction 🏃",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def jump(n):
    steps = 0
    while n > 0:
        n -= (n % 3) + 1
        steps += 1
    return steps

print(jump(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "1" },
    { stdin: "3", expectedOutput: "2" },
    { stdin: "4", expectedOutput: "2" },
    { stdin: "5", expectedOutput: "2" },
    { stdin: "6", expectedOutput: "3" },
    { stdin: "7", expectedOutput: "3" },
    { stdin: "10", expectedOutput: "4" },
    { stdin: "15", expectedOutput: "5" },
    { stdin: "20", expectedOutput: "7" },
    { stdin: "25", expectedOutput: "9" },
    { stdin: "30", expectedOutput: "10" },
    { stdin: "50", expectedOutput: "17" },
    { stdin: "100", expectedOutput: "34" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 36,
  title: "Reverse Sum Combo",
  hint: "Reverse + digit sum combo 🔥",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def combo(n):
    return int(str(n)[::-1]) + sum(int(d) for d in str(n))

print(combo(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "12", expectedOutput: "24" },
    { stdin: "123", expectedOutput: "129" },
    { stdin: "321", expectedOutput: "327" },
    { stdin: "111", expectedOutput: "114" },
    { stdin: "999", expectedOutput: "1026" },
    { stdin: "456", expectedOutput: "471" },
    { stdin: "789", expectedOutput: "804" },
    { stdin: "100", expectedOutput: "1" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "222", expectedOutput: "228" },
    { stdin: "555", expectedOutput: "570" },
    { stdin: "909", expectedOutput: "918" },
    { stdin: "1000", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 37,
  title: "Pair Swap Sum",
  hint: "Swap adjacent pairs ➕",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def pair(arr):
    total = 0
    for i in range(0, len(arr)-1, 2):
        total += arr[i+1] - arr[i]
    return total

arr = list(map(int, input().split()))
print(pair(arr))`,
  testCases: [
    { stdin: "1 2", expectedOutput: "1" },
    { stdin: "1 2 3 4", expectedOutput: "2" },
    { stdin: "5 5 5 5", expectedOutput: "0" },
    { stdin: "2 4 6 8", expectedOutput: "4" },
    { stdin: "10 20 30 40", expectedOutput: "20" },
    { stdin: "1 3 5", expectedOutput: "2" },
    { stdin: "9 8 7 6", expectedOutput: "-2" },
    { stdin: "0 0", expectedOutput: "0" },
    { stdin: "100 200", expectedOutput: "100" },
    { stdin: "5", expectedOutput: "0" },
    { stdin: "", expectedOutput: "0" },
    { stdin: "1 2 3 4 5 6", expectedOutput: "3" },
    { stdin: "6 5 4 3 2 1", expectedOutput: "-3" },
    { stdin: "2 2 2 2", expectedOutput: "0" },
    { stdin: "7 14", expectedOutput: "7" }
  ]
},

{
  qid: 38,
  title: "Bit Shift Game",
  hint: "Count bits × 2 💡",
  difficulty: "medium",
  expectedTimeSeconds: 800,
  pythonCode:
`def bits(n):
    count = 0
    while n:
        count += n & 1
        n >>= 1
    return count * 2

print(bits(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "3", expectedOutput: "4" },
    { stdin: "4", expectedOutput: "2" },
    { stdin: "5", expectedOutput: "4" },
    { stdin: "6", expectedOutput: "4" },
    { stdin: "7", expectedOutput: "6" },
    { stdin: "8", expectedOutput: "2" },
    { stdin: "10", expectedOutput: "4" },
    { stdin: "15", expectedOutput: "8" },
    { stdin: "20", expectedOutput: "4" },
    { stdin: "25", expectedOutput: "6" },
    { stdin: "30", expectedOutput: "8" },
    { stdin: "50", expectedOutput: "6" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 39,
  title: "Increment Pattern",
  hint: "Pattern with condition 🔢",
  difficulty: "medium",
  expectedTimeSeconds: 800,
  pythonCode:
`def inc(n):
    total = 0
    for i in range(n):
        total += (i+1)*(i%2)
    return total

print(inc(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "2" },
    { stdin: "3", expectedOutput: "2" },
    { stdin: "4", expectedOutput: "6" },
    { stdin: "5", expectedOutput: "6" },
    { stdin: "6", expectedOutput: "12" },
    { stdin: "7", expectedOutput: "12" },
    { stdin: "8", expectedOutput: "20" },
    { stdin: "10", expectedOutput: "30" },
    { stdin: "12", expectedOutput: "42" },
    { stdin: "15", expectedOutput: "64" },
    { stdin: "20", expectedOutput: "110" },
    { stdin: "25", expectedOutput: "156" },
    { stdin: "30", expectedOutput: "240" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 40,
  title: "Final Chaos Function",
  hint: "Reverse sum accumulation 🔥",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def final(n):
    res = 0
    for i in range(1, n+1):
        res += int(str(i)[::-1])
    return res

print(final(int(input())))`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "3" },
    { stdin: "3", expectedOutput: "6" },
    { stdin: "4", expectedOutput: "10" },
    { stdin: "5", expectedOutput: "15" },
    { stdin: "6", expectedOutput: "21" },
    { stdin: "7", expectedOutput: "28" },
    { stdin: "8", expectedOutput: "36" },
    { stdin: "9", expectedOutput: "45" },
    { stdin: "10", expectedOutput: "46" },
    { stdin: "11", expectedOutput: "57" },
    { stdin: "12", expectedOutput: "78" },
    { stdin: "15", expectedOutput: "156" },
    { stdin: "20", expectedOutput: "255" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 41,
  title: "Parity Weighted Sprint",
  hint: "Odd normal, even double weight ",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def parity_weighted(n):
    total = 0
    for i in range(1, n + 1):
        if i % 2 == 0:
            total += i * 2
        else:
            total += i
    return total

print(parity_weighted(int(input())))`,
  testCases: [
    { stdin: "0", expectedOutput: "0" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "5" },
    { stdin: "3", expectedOutput: "8" },
    { stdin: "4", expectedOutput: "16" },
    { stdin: "5", expectedOutput: "21" },
    { stdin: "6", expectedOutput: "33" },
    { stdin: "7", expectedOutput: "40" },
    { stdin: "8", expectedOutput: "56" },
    { stdin: "9", expectedOutput: "65" },
    { stdin: "10", expectedOutput: "85" },
    { stdin: "12", expectedOutput: "120" },
    { stdin: "15", expectedOutput: "176" },
    { stdin: "20", expectedOutput: "320" },
    { stdin: "25", expectedOutput: "481" },
    { stdin: "30", expectedOutput: "705" },
    { stdin: "33", expectedOutput: "832" },
    { stdin: "40", expectedOutput: "1240" },
    { stdin: "50", expectedOutput: "1925" },
    { stdin: "60", expectedOutput: "2730" }
  ]
},

{
  qid: 42,
  title: "Digit Stair Product",
  hint: "Digit times next digit value",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def digit_stair(n):
    total = 0
    for ch in str(abs(n)):
        d = int(ch)
        total += d * (d + 1)
    return total

print(digit_stair(int(input())))`,
  testCases: [
    { stdin: "0", expectedOutput: "0" },
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "6" },
    { stdin: "9", expectedOutput: "90" },
    { stdin: "10", expectedOutput: "2" },
    { stdin: "12", expectedOutput: "8" },
    { stdin: "42", expectedOutput: "26" },
    { stdin: "123", expectedOutput: "20" },
    { stdin: "456", expectedOutput: "92" },
    { stdin: "909", expectedOutput: "180" },
    { stdin: "111", expectedOutput: "6" },
    { stdin: "222", expectedOutput: "18" },
    { stdin: "808", expectedOutput: "144" },
    { stdin: "1000", expectedOutput: "2" },
    { stdin: "2468", expectedOutput: "140" },
    { stdin: "5005", expectedOutput: "60" },
    { stdin: "13579", expectedOutput: "190" },
    { stdin: "314159", expectedOutput: "156" },
    { stdin: "98765", expectedOutput: "290" },
    { stdin: "99999", expectedOutput: "450" }
  ]
},

{
  qid: 43,
  title: "Wave Square Drift",
  hint: "Odd squares and even penalties",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def wave_square(n):
    total = 0
    for i in range(1, n + 1):
        if i % 2 == 1:
            total += i * i
        else:
            total -= i
    return total

print(wave_square(int(input())))`,
  testCases: [
    { stdin: "0", expectedOutput: "0" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "-1" },
    { stdin: "3", expectedOutput: "8" },
    { stdin: "4", expectedOutput: "4" },
    { stdin: "5", expectedOutput: "29" },
    { stdin: "6", expectedOutput: "23" },
    { stdin: "7", expectedOutput: "72" },
    { stdin: "8", expectedOutput: "64" },
    { stdin: "9", expectedOutput: "145" },
    { stdin: "10", expectedOutput: "135" },
    { stdin: "12", expectedOutput: "244" },
    { stdin: "15", expectedOutput: "624" },
    { stdin: "20", expectedOutput: "1220" },
    { stdin: "25", expectedOutput: "2769" },
    { stdin: "30", expectedOutput: "4255" },
    { stdin: "35", expectedOutput: "7464" },
    { stdin: "40", expectedOutput: "10240" },
    { stdin: "45", expectedOutput: "15709" },
    { stdin: "50", expectedOutput: "20175" }
  ]
},

{
  qid: 44,
  title: "Neighbor Difference Sum",
  hint: "Use absolute adjacent difference",
  difficulty: "medium",
  expectedTimeSeconds: 900,
  pythonCode:
`def neighbor_diff(arr):
    total = 0
    for i in range(1, len(arr)):
        total += abs(arr[i] - arr[i - 1])
    return total

arr = list(map(int, input().split()))
print(neighbor_diff(arr))`,
  testCases: [
    { stdin: "", expectedOutput: "0" },
    { stdin: "7", expectedOutput: "0" },
    { stdin: "1 2", expectedOutput: "1" },
    { stdin: "2 1", expectedOutput: "1" },
    { stdin: "42 42", expectedOutput: "0" },
    { stdin: "5 5 5 5", expectedOutput: "0" },
    { stdin: "1 100", expectedOutput: "99" },
    { stdin: "100 1", expectedOutput: "99" },
    { stdin: "0 0 0", expectedOutput: "0" },
    { stdin: "1 3 6 10", expectedOutput: "9" },
    { stdin: "9 7 5 3 1", expectedOutput: "8" },
    { stdin: "2 4 8 16 32", expectedOutput: "30" },
    { stdin: "3 1 4 1 5 9", expectedOutput: "16" },
    { stdin: "-1 -2 -3", expectedOutput: "2" },
    { stdin: "-5 0 5", expectedOutput: "10" },
    { stdin: "1 -1 1 -1", expectedOutput: "6" },
    { stdin: "10 10 20 20 30", expectedOutput: "20" },
    { stdin: "8 6 7 5 3 0 9", expectedOutput: "19" },
    { stdin: "1 4 9 16 25", expectedOutput: "24" },
    { stdin: "10 20 10 20", expectedOutput: "30" }
  ]
},

{
  qid: 45,
  title: "Grid Move Score",
  hint: "Cells plus border moves",
  difficulty: "medium",
  expectedTimeSeconds: 850,
  pythonCode:
`def grid_score(n, m):
    return n * m + n + m

n, m = map(int, input().split())
print(grid_score(n, m))`,
  testCases: [
    { stdin: "0 0", expectedOutput: "0" },
    { stdin: "1 1", expectedOutput: "3" },
    { stdin: "1 2", expectedOutput: "5" },
    { stdin: "2 2", expectedOutput: "8" },
    { stdin: "3 4", expectedOutput: "19" },
    { stdin: "5 5", expectedOutput: "35" },
    { stdin: "7 3", expectedOutput: "31" },
    { stdin: "9 1", expectedOutput: "19" },
    { stdin: "2 8", expectedOutput: "26" },
    { stdin: "6 6", expectedOutput: "48" },
    { stdin: "10 10", expectedOutput: "120" },
    { stdin: "12 4", expectedOutput: "64" },
    { stdin: "15 2", expectedOutput: "47" },
    { stdin: "20 1", expectedOutput: "41" },
    { stdin: "11 11", expectedOutput: "143" },
    { stdin: "25 4", expectedOutput: "129" },
    { stdin: "30 3", expectedOutput: "123" },
    { stdin: "50 2", expectedOutput: "152" },
    { stdin: "0 5", expectedOutput: "5" },
    { stdin: "5 0", expectedOutput: "5" }
  ]
}
];
