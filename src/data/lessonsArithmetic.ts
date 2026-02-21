import { Lesson } from './lessons';

export const arithmeticLessons: Lesson[] = [
  {
    id: 8,
    title: "Addition Operations",
    description: "Learn how to add numbers in programming",
    duration: "5 min read",
    category: 'basics',
    order: 8,
    section: "Section 3: Arithmetic Operations",
    subsection: "Subsection 1",
    content: `
# Addition Operations

## The Addition Operator (+)

Addition is one of the four basic arithmetic operations. It combines two or more numbers to produce their sum.

### Basic Syntax
\`\`\`javascript
result = number1 + number2
\`\`\`

### Examples
\`\`\`javascript
sum = 5 + 3        // → 8
total = 10 + 20    // → 30
answer = 7 + 8 + 9 // → 24
\`\`\`

## Addition in Flowcharts

Use the **Process (Rectangle)** symbol:

\`\`\`
┌──────────────────┐
│  sum = a + b     │
└──────────────────┘
\`\`\`

## Types of Addition

### Adding Literals
\`\`\`javascript
result = 5 + 10  // → 15
\`\`\`

### Adding Variables
\`\`\`javascript
a = 5
b = 10
sum = a + b  // → 15
\`\`\`

### Adding Multiple Values
\`\`\`javascript
total = a + b + c + d
\`\`\`

### Accumulation (Running Total)
\`\`\`javascript
total = 0
total = total + 10  // → 10
total = total + 20  // → 30
total = total + 15  // → 45
\`\`\`

## Properties of Addition

### Commutative Property
Order doesn't matter:
\`\`\`javascript
5 + 3 = 3 + 5  // Both equal 8
a + b = b + a
\`\`\`

### Associative Property
Grouping doesn't matter:
\`\`\`javascript
(2 + 3) + 4 = 2 + (3 + 4)  // Both equal 9
\`\`\`

### Identity Property
Adding zero doesn't change the value:
\`\`\`javascript
5 + 0 = 5
x + 0 = x
\`\`\`

## Common Addition Patterns

### Counter Increment
\`\`\`javascript
count = 0
count = count + 1  // Increment by 1
\`\`\`

### Accumulator
\`\`\`javascript
sum = 0
sum = sum + value1
sum = sum + value2
sum = sum + value3
\`\`\`

### Compound Addition
\`\`\`javascript
total = total + amount
// Shorthand:
total += amount
\`\`\`

## Real-World Examples

### Shopping Cart
\`\`\`javascript
cartTotal = 0
cartTotal = cartTotal + item1Price
cartTotal = cartTotal + item2Price
cartTotal = cartTotal + item3Price
console.log("Total: $" + cartTotal)
\`\`\`

### Score Calculation
\`\`\`javascript
totalScore = 0
totalScore = totalScore + round1Score
totalScore = totalScore + round2Score
totalScore = totalScore + round3Score
\`\`\`

### Distance Traveled
\`\`\`javascript
totalDistance = 0
totalDistance = totalDistance + day1Distance
totalDistance = totalDistance + day2Distance
\`\`\`

## Addition with Different Data Types

### Integer Addition
\`\`\`javascript
5 + 3 = 8
\`\`\`

### Decimal Addition
\`\`\`javascript
5.5 + 3.2 = 8.7
\`\`\`

### Mixed Addition
\`\`\`javascript
5 + 3.5 = 8.5
\`\`\`

### String Concatenation (Not Addition!)
In some languages, + joins strings:
\`\`\`javascript
"Hello" + " " + "World" = "Hello World"
\`\`\`

## Common Mistakes

### Type Confusion
\`\`\`javascript
// ❌ String concatenation
"5" + "3" = "53"

// ✅ Numeric addition
5 + 3 = 8
\`\`\`

### Uninitialized Variables
\`\`\`javascript
// ❌ What if sum has no value?
sum = sum + 10

// ✅ Initialize first
sum = 0
sum = sum + 10
\`\`\`

### Order of Operations
\`\`\`javascript
result = 2 + 3 * 4
// → 2 + 12 = 14  (Multiplication first!)

result = (2 + 3) * 4
// → 5 * 4 = 20   (Parentheses first!)
\`\`\`

## Practice Exercise

Create a flowchart that:
1. Reads three test scores
2. Calculates the total
3. Displays the sum

This reinforces input, addition, and output!
    `
  },
  {
    id: 9,
    title: "Subtraction Operations",
    description: "Master subtraction in programming",
    duration: "5 min read",
    category: 'basics',
    order: 9,
    section: "Section 3: Arithmetic Operations",
    subsection: "Subsection 2",
    content: `
# Subtraction Operations

## The Subtraction Operator (-)

Subtraction finds the difference between two numbers by removing one value from another.

### Basic Syntax
\`\`\`javascript
result = number1 - number2
\`\`\`

### Examples
\`\`\`javascript
difference = 10 - 3  // → 7
remaining = 50 - 20  // → 30
change = 100 - 75    // → 25
\`\`\`

## Subtraction in Flowcharts

\`\`\`
┌──────────────────────┐
│  difference = a - b  │
└──────────────────────┘
\`\`\`

## Types of Subtraction

### Simple Subtraction
\`\`\`javascript
result = 15 - 7  // → 8
\`\`\`

### Variable Subtraction
\`\`\`javascript
a = 20
b = 8
difference = a - b  // → 12
\`\`\`

### Decrement Pattern
\`\`\`javascript
count = 10
count = count - 1  // → 9
\`\`\`

### Compound Subtraction
\`\`\`javascript
balance = balance - withdrawal
// Shorthand:
balance -= withdrawal
\`\`\`

## Important Properties

### NOT Commutative
Order DOES matter:
\`\`\`javascript
10 - 3 = 7
3 - 10 = -7  // ← Different result!
\`\`\`

### NOT Associative
Grouping matters:
\`\`\`javascript
(10 - 5) - 2 = 3
10 - (5 - 2) = 7  // ← Different!
\`\`\`

### Identity Property
Subtracting zero doesn't change the value:
\`\`\`javascript
10 - 0 = 10
x - 0 = x
\`\`\`

## Common Subtraction Patterns

### Counter Decrement
\`\`\`javascript
count = 10
count = count - 1  // Decrement by 1
\`\`\`

### Balance Tracking
\`\`\`javascript
balance = 1000
balance = balance - purchase1
balance = balance - purchase2
\`\`\`

### Remaining Items
\`\`\`javascript
inventory = 100
inventory = inventory - sold
\`\`\`

## Real-World Examples

### Bank Account
\`\`\`javascript
balance = 1000
withdrawal = 250
balance = balance - withdrawal
console.log("Remaining: $" + balance)  // → $750
\`\`\`

### Countdown Timer
\`\`\`javascript
timeLeft = 60
timeLeft = timeLeft - 1  // → 59 seconds
timeLeft = timeLeft - 1  // → 58 seconds
\`\`\`

### Inventory Management
\`\`\`javascript
stock = 50
sold = 12
stock = stock - sold
console.log("Items left: " + stock)  // → 38
\`\`\`

## Negative Numbers

Subtraction can produce negative results:
\`\`\`javascript
balance = 100
withdrawal = 150
balance = balance - withdrawal  // → -50 (overdrawn!)
\`\`\`

### Checking for Negatives
\`\`\`javascript
if (balance - withdrawal < 0) {
  console.log("Insufficient funds")
} else {
  balance = balance - withdrawal
}
\`\`\`

## Common Mistakes

### Wrong Order
\`\`\`javascript
// ❌ Might not be intended
difference = 5 - 10  // → -5

// ✅ Check your order
difference = 10 - 5  // → 5
\`\`\`

### Uninitialized Variables
\`\`\`javascript
// ❌ What if count has no value?
count = count - 1

// ✅ Initialize first
count = 10
count = count - 1
\`\`\`

### Forgetting Negative Results
\`\`\`javascript
// Always check if result can be negative!
\`\`\`

## Practice Exercise

Create a flowchart that:
1. Reads initial balance
2. Reads withdrawal amount
3. Checks if withdrawal is possible
4. If yes: subtract and display new balance
5. If no: display error message
    `
  }
];
