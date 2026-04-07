export const questionBank = [

/* ================= 1–10 ================= */

{
  qid: 1,
  title: "Sum 1 to N",
  hint: "Add numbers from 1 to n",
  difficulty: "easy",
  expectedTimeSeconds: 300,
  pythonCode:
`n = int(input())
s = 0
for i in range(1, n+1):
    s += i
print(s)`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "5", expectedOutput: "15" },
    { stdin: "10", expectedOutput: "55" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "3", expectedOutput: "6" }
  ]
},

{
  qid: 2,
  title: "Count Evens",
  hint: "Check divisible by 2",
  difficulty: "easy",
  pythonCode:
`n = int(input())
c = 0
for i in range(1, n+1):
    if i % 2 == 0:
        c += 1
print(c)`,
  testCases: [
    { stdin: "1", expectedOutput: "0" },
    { stdin: "2", expectedOutput: "1" },
    { stdin: "10", expectedOutput: "5" },
    { stdin: "7", expectedOutput: "3" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 3,
  title: "Reverse Number",
  hint: "Use loop",
  difficulty: "easy",
  pythonCode:
`n = int(input())
r = 0
while n > 0:
    r = r*10 + n%10
    n//=10
print(r)`,
  testCases: [
    { stdin: "123", expectedOutput: "321" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "5", expectedOutput: "5" },
    { stdin: "100", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 4,
  title: "Find Max",
  hint: "Compare values",
  difficulty: "easy",
  pythonCode:
`a = list(map(int, input().split()))
m = a[0]
for x in a:
    if x > m:
        m = x
print(m)`,
  testCases: [
    { stdin: "1 2 3", expectedOutput: "3" },
    { stdin: "5 4 3", expectedOutput: "5" },
    { stdin: "7", expectedOutput: "7" },
    { stdin: "-1 -2", expectedOutput: "-1" },
    { stdin: "9 9", expectedOutput: "9" }
  ]
},

{
  qid: 5,
  title: "Count Digits",
  hint: "Divide by 10",
  difficulty: "easy",
  pythonCode:
`n = int(input())
c = 0
if n == 0:
    c = 1
while n > 0:
    n//=10
    c+=1
print(c)`,
  testCases: [
    { stdin: "0", expectedOutput: "1" },
    { stdin: "5", expectedOutput: "1" },
    { stdin: "123", expectedOutput: "3" },
    { stdin: "1000", expectedOutput: "4" },
    { stdin: "99", expectedOutput: "2" }
  ]
},

{
  qid: 6,
  title: "Sum of Array",
  difficulty: "easy",
  pythonCode:
`a = list(map(int, input().split()))
s = 0
for x in a:
    s += x
print(s)`,
  testCases: [
    { stdin: "1 2 3", expectedOutput: "6" },
    { stdin: "5 5", expectedOutput: "10" },
    { stdin: "10", expectedOutput: "10" },
    { stdin: "", expectedOutput: "0" },
    { stdin: "1 1 1", expectedOutput: "3" }
  ]
},

{
  qid: 7,
  title: "Even or Odd",
  difficulty: "easy",
  pythonCode:
`n = int(input())
if n%2==0:
    print("EVEN")
else:
    print("ODD")`,
  testCases: [
    { stdin: "2", expectedOutput: "EVEN" },
    { stdin: "3", expectedOutput: "ODD" },
    { stdin: "0", expectedOutput: "EVEN" },
    { stdin: "7", expectedOutput: "ODD" },
    { stdin: "10", expectedOutput: "EVEN" }
  ]
},

{
  qid: 8,
  title: "Factorial",
  difficulty: "easy",
  pythonCode:
`n = int(input())
f = 1
for i in range(1,n+1):
    f*=i
print(f)`,
  testCases: [
    { stdin: "0", expectedOutput: "1" },
    { stdin: "3", expectedOutput: "6" },
    { stdin: "5", expectedOutput: "120" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "4", expectedOutput: "24" }
  ]
},

{
  qid: 9,
  title: "Count Vowels",
  difficulty: "easy",
  pythonCode:
`s = input()
c=0
for ch in s:
    if ch in "aeiouAEIOU":
        c+=1
print(c)`,
  testCases: [
    { stdin: "hello", expectedOutput: "2" },
    { stdin: "xyz", expectedOutput: "0" },
    { stdin: "AEIOU", expectedOutput: "5" },
    { stdin: "", expectedOutput: "0" },
    { stdin: "code", expectedOutput: "2" }
  ]
},

{
  qid: 10,
  title: "Digit Sum",
  difficulty: "easy",
  pythonCode:
`n = int(input())
s=0
while n>0:
    s+=n%10
    n//=10
print(s)`,
  testCases: [
    { stdin: "123", expectedOutput: "6" },
    { stdin: "100", expectedOutput: "1" },
    { stdin: "9", expectedOutput: "9" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "999", expectedOutput: "27" }
  ]
},

/* ================= 11–20 ================= */

{
  qid: 11,
  title: "Print 1 to N",
  difficulty: "easy",
  pythonCode:
`n=int(input())
for i in range(1,n+1):
    print(i,end=" ")`,
  testCases: [
    { stdin: "3", expectedOutput: "1 2 3" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "" },
    { stdin: "2", expectedOutput: "1 2" },
    { stdin: "5", expectedOutput: "1 2 3 4 5" }
  ]
},

{
  qid: 12,
  title: "Multiplication Table",
  difficulty: "easy",
  pythonCode:
`n=int(input())
for i in range(1,6):
    print(n*i,end=" ")`,
  testCases: [
    { stdin: "2", expectedOutput: "2 4 6 8 10" },
    { stdin: "1", expectedOutput: "1 2 3 4 5" },
    { stdin: "3", expectedOutput: "3 6 9 12 15" },
    { stdin: "5", expectedOutput: "5 10 15 20 25" },
    { stdin: "0", expectedOutput: "0 0 0 0 0" }
  ]
},

{
  qid: 13,
  title: "Count Odd",
  pythonCode:
`n=int(input())
c=0
for i in range(1,n+1):
    if i%2:
        c+=1
print(c)`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "1" },
    { stdin: "5", expectedOutput: "3" },
    { stdin: "10", expectedOutput: "5" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 14,
  title: "Min in Array",
  pythonCode:
`a=list(map(int,input().split()))
m=a[0]
for x in a:
    if x<m:
        m=x
print(m)`,
  testCases: [
    { stdin: "3 2 1", expectedOutput: "1" },
    { stdin: "5 6", expectedOutput: "5" },
    { stdin: "10", expectedOutput: "10" },
    { stdin: "-1 -2", expectedOutput: "-2" },
    { stdin: "7 7", expectedOutput: "7" }
  ]
},

{
  qid: 15,
  title: "Square Numbers",
  pythonCode:
`n=int(input())
for i in range(1,n+1):
    print(i*i,end=" ")`,
  testCases: [
    { stdin: "3", expectedOutput: "1 4 9" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "1 4" },
    { stdin: "0", expectedOutput: "" },
    { stdin: "4", expectedOutput: "1 4 9 16" }
  ]
},

/* ================= 16–30 ================= */

{
  qid: 16,
  title: "Cube Numbers",
  pythonCode:
`n=int(input())
for i in range(1,n+1):
    print(i*i*i,end=" ")`,
  testCases: [
    { stdin: "3", expectedOutput: "1 8 27" },
    { stdin: "2", expectedOutput: "1 8" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "" },
    { stdin: "4", expectedOutput: "1 8 27 64" }
  ]
},

{
  qid: 17,
  title: "Sum Even Numbers",
  pythonCode:
`n=int(input())
s=0
for i in range(1,n+1):
    if i%2==0:
        s+=i
print(s)`,
  testCases: [
    { stdin: "4", expectedOutput: "6" },
    { stdin: "5", expectedOutput: "6" },
    { stdin: "10", expectedOutput: "30" },
    { stdin: "1", expectedOutput: "0" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 18,
  title: "Sum Odd Numbers",
  pythonCode:
`n=int(input())
s=0
for i in range(1,n+1):
    if i%2:
        s+=i
print(s)`,
  testCases: [
    { stdin: "5", expectedOutput: "9" },
    { stdin: "4", expectedOutput: "4" },
    { stdin: "10", expectedOutput: "25" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 19,
  title: "Product of Digits",
  pythonCode:
`n=int(input())
p=1
while n>0:
    p*=n%10
    n//=10
print(p)`,
  testCases: [
    { stdin: "123", expectedOutput: "6" },
    { stdin: "111", expectedOutput: "1" },
    { stdin: "999", expectedOutput: "729" },
    { stdin: "10", expectedOutput: "0" },
    { stdin: "5", expectedOutput: "5" }
  ]
},

{
  qid: 20,
  title: "Check Positive",
  pythonCode:
`n=int(input())
if n>0:
    print("YES")
else:
    print("NO")`,
  testCases: [
    { stdin: "1", expectedOutput: "YES" },
    { stdin: "-1", expectedOutput: "NO" },
    { stdin: "0", expectedOutput: "NO" },
    { stdin: "5", expectedOutput: "YES" },
    { stdin: "-10", expectedOutput: "NO" }
  ]
},

/* ================= 21–45 ================= */
/* SAME PATTERN — SIMPLE LOGIC CONTINUES */

{
  qid: 21,
  title: "Double Number",
  pythonCode: `n=int(input()); print(n*2)`,
  testCases: [
    { stdin: "2", expectedOutput: "4" },
    { stdin: "5", expectedOutput: "10" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "-1", expectedOutput: "-2" },
    { stdin: "10", expectedOutput: "20" }
  ]
},

{
  qid: 22,
  title: "Square Number",
  pythonCode: `n=int(input()); print(n*n)`,
  testCases: [
    { stdin: "2", expectedOutput: "4" },
    { stdin: "3", expectedOutput: "9" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "-2", expectedOutput: "4" },
    { stdin: "5", expectedOutput: "25" }
  ]
},

{
  qid: 23,
  title: "Cube Number",
  pythonCode: `n=int(input()); print(n*n*n)`,
  testCases: [
    { stdin: "2", expectedOutput: "8" },
    { stdin: "3", expectedOutput: "27" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "-2", expectedOutput: "-8" },
    { stdin: "5", expectedOutput: "125" }
  ]
},

{
  qid: 24,
  title: "Add Two Numbers",
  pythonCode: `a,b=map(int,input().split()); print(a+b)`,
  testCases: [
    { stdin: "1 2", expectedOutput: "3" },
    { stdin: "5 5", expectedOutput: "10" },
    { stdin: "0 0", expectedOutput: "0" },
    { stdin: "-1 1", expectedOutput: "0" },
    { stdin: "10 20", expectedOutput: "30" }
  ]
},

{
  qid: 25,
  title: "Multiply Two Numbers",
  pythonCode: `a,b=map(int,input().split()); print(a*b)`,
  testCases: [
    { stdin: "2 3", expectedOutput: "6" },
    { stdin: "5 5", expectedOutput: "25" },
    { stdin: "0 10", expectedOutput: "0" },
    { stdin: "-2 3", expectedOutput: "-6" },
    { stdin: "10 10", expectedOutput: "100" }
  ]
},

{
  qid: 26,
  title: "Check Divisible by 5",
  pythonCode:
`n=int(input())
if n%5==0:
    print("YES")
else:
    print("NO")`,
  testCases: [
    { stdin: "5", expectedOutput: "YES" },
    { stdin: "10", expectedOutput: "YES" },
    { stdin: "3", expectedOutput: "NO" },
    { stdin: "0", expectedOutput: "YES" },
    { stdin: "7", expectedOutput: "NO" }
  ]
},

{
  qid: 27,
  title: "Print N Times",
  pythonCode:
`n=int(input())
for i in range(n):
    print("Hi",end=" ")`,
  testCases: [
    { stdin: "1", expectedOutput: "Hi" },
    { stdin: "2", expectedOutput: "Hi Hi" },
    { stdin: "0", expectedOutput: "" },
    { stdin: "3", expectedOutput: "Hi Hi Hi" },
    { stdin: "5", expectedOutput: "Hi Hi Hi Hi Hi" }
  ]
},

{
  qid: 28,
  title: "Check Greater",
  pythonCode:
`a,b=map(int,input().split())
if a>b:
    print(a)
else:
    print(b)`,
  testCases: [
    { stdin: "1 2", expectedOutput: "2" },
    { stdin: "5 3", expectedOutput: "5" },
    { stdin: "7 7", expectedOutput: "7" },
    { stdin: "-1 1", expectedOutput: "1" },
    { stdin: "10 20", expectedOutput: "20" }
  ]
},

{
  qid: 29,
  title: "Absolute Value",
  pythonCode:
`n=int(input())
if n<0:
    n=-n
print(n)`,
  testCases: [
    { stdin: "-5", expectedOutput: "5" },
    { stdin: "5", expectedOutput: "5" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "-10", expectedOutput: "10" },
    { stdin: "7", expectedOutput: "7" }
  ]
},

{
  qid: 30,
  title: "Print Reverse 1 to N",
  pythonCode:
`n=int(input())
for i in range(n,0,-1):
    print(i,end=" ")`,
  testCases: [
    { stdin: "3", expectedOutput: "3 2 1" },
    { stdin: "1", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "" },
    { stdin: "5", expectedOutput: "5 4 3 2 1" },
    { stdin: "2", expectedOutput: "2 1" }
  ]
},

/* 31–45 similar ultra-simple problems */

{
  qid: 31,
  title: "Add 10",
  pythonCode: `n=int(input()); print(n+10)`,
  testCases: [
    { stdin: "5", expectedOutput: "15" },
    { stdin: "0", expectedOutput: "10" },
    { stdin: "-5", expectedOutput: "5" },
    { stdin: "10", expectedOutput: "20" },
    { stdin: "1", expectedOutput: "11" }
  ]
},

{
  qid: 32,
  title: "Multiply by 3",
  pythonCode: `n=int(input()); print(n*3)`,
  testCases: [
    { stdin: "2", expectedOutput: "6" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "-2", expectedOutput: "-6" },
    { stdin: "5", expectedOutput: "15" },
    { stdin: "10", expectedOutput: "30" }
  ]
},

{
  qid: 33,
  title: "Divide by 2",
  pythonCode: `n=int(input()); print(n//2)`,
  testCases: [
    { stdin: "4", expectedOutput: "2" },
    { stdin: "5", expectedOutput: "2" },
    { stdin: "1", expectedOutput: "0" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "10", expectedOutput: "5" }
  ]
},

{
  qid: 34,
  title: "Check Zero",
  pythonCode:
`n=int(input())
if n==0:
    print("YES")
else:
    print("NO")`,
  testCases: [
    { stdin: "0", expectedOutput: "YES" },
    { stdin: "1", expectedOutput: "NO" },
    { stdin: "-1", expectedOutput: "NO" },
    { stdin: "5", expectedOutput: "NO" },
    { stdin: "0", expectedOutput: "YES" }
  ]
},

{
  qid: 35,
  title: "Add Last Digit",
  pythonCode:
`n=int(input())
print(n + n%10)`,
  testCases: [
    { stdin: "12", expectedOutput: "14" },
    { stdin: "5", expectedOutput: "10" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "99", expectedOutput: "108" },
    { stdin: "101", expectedOutput: "102" }
  ]
},

{
  qid: 36,
  title: "Remove Last Digit",
  pythonCode: `n=int(input()); print(n//10)`,
  testCases: [
    { stdin: "123", expectedOutput: "12" },
    { stdin: "5", expectedOutput: "0" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "99", expectedOutput: "9" }
  ]
},

{
  qid: 37,
  title: "Check Multiple of 3",
  pythonCode:
`n=int(input())
print("YES" if n%3==0 else "NO")`,
  testCases: [
    { stdin: "3", expectedOutput: "YES" },
    { stdin: "4", expectedOutput: "NO" },
    { stdin: "6", expectedOutput: "YES" },
    { stdin: "0", expectedOutput: "YES" },
    { stdin: "7", expectedOutput: "NO" }
  ]
},

{
  qid: 38,
  title: "Add First Two Digits",
  pythonCode:
`n=input()
if len(n)>=2:
    print(int(n[0])+int(n[1]))
else:
    print(int(n))`,
  testCases: [
    { stdin: "12", expectedOutput: "3" },
    { stdin: "5", expectedOutput: "5" },
    { stdin: "99", expectedOutput: "18" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "23", expectedOutput: "5" }
  ]
},

{
  qid: 39,
  title: "Print Stars",
  pythonCode:
`n=int(input())
for i in range(n):
    print("*",end="")`,
  testCases: [
    { stdin: "3", expectedOutput: "***" },
    { stdin: "1", expectedOutput: "*" },
    { stdin: "0", expectedOutput: "" },
    { stdin: "5", expectedOutput: "*****" },
    { stdin: "2", expectedOutput: "**" }
  ]
},

{
  qid: 40,
  title: "Sum of First Two Numbers",
  pythonCode:
`a=list(map(int,input().split()))
if len(a)>=2:
    print(a[0]+a[1])
else:
    print(a[0])`,
  testCases: [
    { stdin: "1 2", expectedOutput: "3" },
    { stdin: "5", expectedOutput: "5" },
    { stdin: "10 20", expectedOutput: "30" },
    { stdin: "0 0", expectedOutput: "0" },
    { stdin: "3 4", expectedOutput: "7" }
  ]
},

{
  qid: 41,
  title: "Square Last Digit",
  pythonCode:
`n=int(input())
d=n%10
print(d*d)`,
  testCases: [
    { stdin: "12", expectedOutput: "4" },
    { stdin: "5", expectedOutput: "25" },
    { stdin: "0", expectedOutput: "0" },
    { stdin: "19", expectedOutput: "81" },
    { stdin: "23", expectedOutput: "9" }
  ]
},

{
  qid: 42,
  title: "Sum First N Even",
  pythonCode:
`n=int(input())
s=0
for i in range(1,n+1):
    s+=2*i
print(s)`,
  testCases: [
    { stdin: "1", expectedOutput: "2" },
    { stdin: "2", expectedOutput: "6" },
    { stdin: "3", expectedOutput: "12" },
    { stdin: "5", expectedOutput: "30" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 43,
  title: "Sum First N Odd",
  pythonCode:
`n=int(input())
s=0
for i in range(n):
    s+=2*i+1
print(s)`,
  testCases: [
    { stdin: "1", expectedOutput: "1" },
    { stdin: "2", expectedOutput: "4" },
    { stdin: "3", expectedOutput: "9" },
    { stdin: "5", expectedOutput: "25" },
    { stdin: "0", expectedOutput: "0" }
  ]
},

{
  qid: 44,
  title: "Check Equal",
  pythonCode:
`a,b=map(int,input().split())
print("YES" if a==b else "NO")`,
  testCases: [
    { stdin: "1 1", expectedOutput: "YES" },
    { stdin: "1 2", expectedOutput: "NO" },
    { stdin: "0 0", expectedOutput: "YES" },
    { stdin: "-1 1", expectedOutput: "NO" },
    { stdin: "5 5", expectedOutput: "YES" }
  ]
},

{
  qid: 45,
  title: "Sum of Two Digits",
  pythonCode:
`n=int(input())
print(n%10 + (n//10)%10)`,
  testCases: [
    { stdin: "12", expectedOutput: "3" },
    { stdin: "99", expectedOutput: "18" },
    { stdin: "10", expectedOutput: "1" },
    { stdin: "5", expectedOutput: "5" },
    { stdin: "23", expectedOutput: "5" }
  ]
}

];