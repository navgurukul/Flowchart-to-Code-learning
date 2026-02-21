import { QuizQuestion } from '../components/LessonQuiz';

export interface Lesson {
  id: number;
  title: string;
  description: string;
  content: string;
  duration: string; // e.g., "5 min read"
  category: 'basics' | 'flowcharts' | 'logic' | 'advanced';
  order: number;
  section?: string; // e.g., "Section 1: Introduction"
  subsection?: string; // e.g., "Subsection 1"
  quiz?: QuizQuestion[]; // Optional quiz questions
}

export const lessons: Lesson[] = [
  // SECTION 1: INTRODUCTION
  {
    id: 1,
    title: "Introduction to Flowcharts",
    description: "Understanding what flowcharts are and why they matter",
    duration: "5 min read",
    category: 'flowcharts',
    order: 1,
    section: "Section 1: Introduction",
    subsection: "Subsection 1",
    content: `
# Introduction to Flowcharts

## What is a Flowchart?

A flowchart is a visual diagram that represents a process, algorithm, or workflow. It uses standardized symbols connected by arrows to show the sequence of steps needed to solve a problem or complete a task.

## Why Use Flowcharts?

**Visual Clarity**: Flowcharts make complex processes easy to understand at a glance.

**Problem Solving**: Breaking down problems into visual steps helps identify logical errors before writing code.

**Communication**: Teams can discuss and improve processes using a common visual language.

**Documentation**: Flowcharts serve as clear documentation for how a program works.

## Real-World Applications

- Software development and algorithm design
- Business process mapping
- Manufacturing workflows
- Decision-making procedures
- Troubleshooting guides

## The Power of Visual Thinking

Before computers can execute instructions, programmers must think through the logic. Flowcharts bridge the gap between human thinking and computer execution by providing a visual representation of logic that both humans and computers can understand.

Think of a flowchart as a roadmap for your program - it shows where you start, what decisions you need to make, and where you end up.
    `,
    quiz: [
      {
        id: 1,
        question: "What is a flowchart?",
        type: "multiple-choice",
        options: [
          "A type of programming language",
          "A visual diagram representing a process or algorithm",
          "A database management tool",
          "A text editor for code"
        ],
        correctAnswer: 1,
        explanation: "A flowchart is a visual diagram that represents a process, algorithm, or workflow using standardized symbols."
      },
      {
        id: 2,
        question: "Flowcharts help with problem solving by breaking down problems into _____ steps.",
        type: "fill-blank",
        correctAnswer: "visual",
        explanation: "Flowcharts break down problems into visual steps, making it easier to identify logical errors."
      },
      {
        id: 3,
        question: "Every flowchart must have a start and an end point.",
        type: "true-false",
        correctAnswer: "True",
        explanation: "Every flowchart must have exactly one start point and one end point to show where the process begins and ends."
      }
    ]
  },
  {
    id: 2,
    title: "Flowchart Symbols and Conventions",
    description: "Learn the standard symbols used in flowcharts",
    duration: "7 min read",
    category: 'flowcharts',
    order: 2,
    section: "Section 1: Introduction",
    subsection: "Subsection 2",
    content: `
# Flowchart Symbols and Conventions

## Standard Flowchart Symbols

### Start/End (Terminal) - Oval Shape
- Marks the beginning or end of a flowchart
- Every flowchart must have exactly ONE start and ONE end
- Example: "START" or "END"

### Input/Output - Parallelogram
- Represents data entering or leaving the system
- Input: Reading data from user, file, or sensor
- Output: Displaying results, printing, or saving data
- Examples: "Read number", "Display result"

### Process - Rectangle
- Shows calculations, operations, or assignments
- Any action that changes data or performs computation
- Examples: "sum = a + b", "count = count + 1"

### Decision - Diamond
- Represents a yes/no question or condition
- Always has TWO paths: True/Yes and False/No
- Examples: "Is x > 10?", "Is password correct?"

### Loop - Hexagon
- Indicates repeated actions
- Continues until a condition is met
- Examples: "For i = 1 to 10", "While count < 100"

### Connector - Small Circle
- Connects different parts of a flowchart
- Useful for avoiding crossed lines
- Labeled with letters or numbers

### Flow Lines - Arrows
- Show the direction of flow
- Connect symbols in sequence
- Typically flow from top to bottom, left to right

## Best Practices

1. **Keep it Simple**: One symbol, one action
2. **Clear Labels**: Use descriptive text in each symbol
3. **Consistent Flow**: Generally top-to-bottom, left-to-right
4. **Avoid Crossing Lines**: Use connectors if needed
5. **Label Decision Paths**: Mark "Yes/No" or "True/False" on branches
6. **Test Your Logic**: Walk through with sample data

## Common Mistakes to Avoid

❌ Multiple start or end points
❌ Unlabeled decision branches
❌ Processes without clear actions
❌ Arrows pointing in confusing directions
❌ Missing connections between symbols

✅ One clear start and end
✅ All paths labeled
✅ Clear, specific actions
✅ Logical flow direction
✅ All symbols connected
    `
  },

  // SECTION 2: VARIABLES, INPUT AND OUTPUT
  {
    id: 3,
    title: "Input and Output Operations",
    description: "Learn how programs receive data and display results",
    duration: "6 min read",
    category: 'basics',
    order: 3,
    section: "Section 2: Variables, Input and Output",
    subsection: "Subsection 1",
    content: `
# Input and Output Operations

## What is Input?

Input is data that a program receives from external sources. Think of it as information flowing INTO your program.

### Common Input Sources
- **User Input**: Keyboard entries, mouse clicks
- **Files**: Reading data from text files, databases
- **Sensors**: Temperature, location, motion data
- **Network**: Data from internet or other computers

### Input in Flowcharts
Use the **Parallelogram** symbol for input operations.

\`\`\`
┌─────────────────┐
│  Read number    │  ← Input symbol
└─────────────────┘
\`\`\`

### Examples
- "Read age"
- "Input username"
- "Get temperature"
- "Enter password"

## What is Output?

Output is data that a program sends to external destinations. Information flowing OUT of your program.

### Common Output Destinations
- **Screen**: Displaying text, graphics, results
- **Files**: Saving data to disk
- **Printers**: Physical documents
- **Network**: Sending data to other systems
- **Speakers**: Audio output

### Output in Flowcharts
Also uses the **Parallelogram** symbol.

\`\`\`
┌─────────────────┐
│  Display sum    │  ← Output symbol
└─────────────────┘
\`\`\`

### Examples
- "Display result"
- "Print message"
- "Show error"
- "Output total"

## Input/Output Flow Example

\`\`\`
START
  ↓
Read first number (a)
  ↓
Read second number (b)
  ↓
sum = a + b
  ↓
Display sum
  ↓
END
\`\`\`

## Important Concepts

**Input Before Use**: Always input data before using it in calculations.

**Clear Prompts**: Tell users what input you expect.
- Good: "Enter your age (0-120)"
- Bad: "Enter number"

**Validate Input**: Check if input makes sense.
- Is age negative? That's invalid!
- Is the string empty? Handle it!

**Meaningful Output**: Display results clearly.
- Good: "The sum is: 25"
- Bad: "25"

## Practice Exercise

Design a flowchart that:
1. Asks user for their name
2. Asks for their favorite number
3. Displays a greeting with their name and number

This simple exercise uses both input and output operations!
    `
  },
  {
    id: 4,
    title: "Variables - Storage Containers",
    description: "Understanding how programs store and manage data",
    duration: "8 min read",
    category: 'basics',
    order: 4,
    section: "Section 2: Variables, Input and Output",
    subsection: "Subsection 2",
    content: `
# Variables - Storage Containers

## What is a Variable?

A variable is a named storage location in computer memory that holds a value. Think of it as a labeled box where you can store information.

\`\`\`
┌─────────────┐
│   age: 25   │  ← Variable named "age" storing value 25
└─────────────┘
\`\`\`

## Why Do We Need Variables?

**Store Data**: Keep information for later use
**Reuse Values**: Use the same data multiple times
**Track Changes**: Update values as program runs
**Make Code Flexible**: Work with different data

## Variable Names

### Good Variable Names
- **Descriptive**: \`studentAge\` not \`sa\`
- **Meaningful**: \`totalPrice\` not \`tp\`
- **Clear**: \`isLoggedIn\` not \`flag\`

### Naming Rules
- Start with a letter (not a number)
- Use letters, numbers, underscores
- No spaces (use camelCase or snake_case)
- Avoid special characters
- Case-sensitive: \`age\` ≠ \`Age\`

### Examples
✅ Good: \`firstName\`, \`total_score\`, \`maxValue\`
❌ Bad: \`x\`, \`temp\`, \`data1\`, \`asdf\`

## Types of Data

### Numbers
- **Integers**: Whole numbers (5, -3, 0, 100)
- **Decimals**: Floating-point (3.14, -0.5, 2.0)

\`\`\`
age = 25
price = 19.99
temperature = -5
\`\`\`

### Text (Strings)
- Sequences of characters
- Enclosed in quotes

\`\`\`
name = "Alice"
message = "Hello, World!"
email = "user@example.com"
\`\`\`

### Boolean
- True or False values
- Used for conditions

\`\`\`
isStudent = true
hasLicense = false
isRaining = true
\`\`\`

### Lists/Arrays
- Collections of values
- Ordered sequences

\`\`\`
scores = [85, 92, 78, 95]
names = ["Alice", "Bob", "Charlie"]
\`\`\`

## Variable Operations

### Declaration
Creating a variable for the first time:
\`\`\`
age
score
userName
\`\`\`

### Initialization
Giving a variable its first value:
\`\`\`
age = 0
score = 100
userName = "Guest"
\`\`\`

### Assignment
Changing a variable's value:
\`\`\`
age = 25
score = score + 10
userName = "Alice"
\`\`\`

### Reading
Using a variable's value:
\`\`\`
Display age
total = price + tax
if (score > 90)
\`\`\`

## Variable Scope

**Local Variables**: Only exist within a specific part of the program
**Global Variables**: Accessible throughout the entire program

## Memory Concept

When you create a variable:
1. Computer reserves memory space
2. Labels it with the variable name
3. Stores the value in that space
4. You can read or change it anytime

\`\`\`
Memory:
┌──────────┬───────┐
│ Variable │ Value │
├──────────┼───────┤
│ age      │  25   │
│ name     │ "Bob" │
│ score    │  95   │
└──────────┴───────┘
\`\`\`

## Best Practices

1. **Initialize Variables**: Give them starting values
2. **Use Meaningful Names**: Code should be self-documenting
3. **One Purpose**: Each variable should have one clear purpose
4. **Avoid Magic Numbers**: Use named constants instead
   - Bad: \`if (age > 18)\`
   - Good: \`minimumAge = 18; if (age > minimumAge)\`

## Common Mistakes

❌ Using variables before initializing them
❌ Confusing variable names (x, y, z for everything)
❌ Overwriting important values accidentally
❌ Not updating variables when needed

✅ Initialize before use
✅ Clear, descriptive names
✅ Careful with assignments
✅ Track variable changes
    `
  },
  {
    id: 5,
    title: "Understanding Variables in Depth",
    description: "Deep dive into variable concepts and memory",
    duration: "7 min read",
    category: 'basics',
    order: 5,
    section: "Section 2: Variables, Input and Output",
    subsection: "Subsection 3",
    content: `
# Understanding Variables in Depth

## Variables as Memory Locations

Every variable in a program corresponds to a specific location in computer memory. Understanding this helps you write better code.

### Memory Address Concept

\`\`\`
Memory Address  │  Variable Name  │  Value
─────────────────┼─────────────────┼────────
0x1000          │  age            │  25
0x1004          │  score          │  95
0x1008          │  name           │  "Alice"
\`\`\`

When you use a variable name, the computer:
1. Looks up the memory address
2. Retrieves the value stored there
3. Uses it in your operation

## Variable Lifetime

### Creation
Variables are created when declared:
\`\`\`
number = 0  ← Variable 'number' now exists
\`\`\`

### Usage
Variables can be read and modified:
\`\`\`
number = 5        ← Assign value
result = number * 2  ← Read value
number = number + 1  ← Read and modify
\`\`\`

### Destruction
Variables are destroyed when no longer needed:
- End of program
- End of function/block (for local variables)

## Variable Assignment Deep Dive

### Simple Assignment
\`\`\`
x = 10
\`\`\`
Stores value 10 in variable x.

### Copy Assignment
\`\`\`
x = 10
y = x
\`\`\`
Copies the VALUE from x to y. Now both have 10.

### Expression Assignment
\`\`\`
x = 5
y = x * 2 + 3
\`\`\`
Evaluates expression first (5 * 2 + 3 = 13), then assigns to y.

### Self-Assignment
\`\`\`
count = 0
count = count + 1
\`\`\`
Reads current value (0), adds 1, stores result (1) back.

## Common Patterns

### Counter Pattern
\`\`\`
count = 0
count = count + 1  ← Increment
count = count - 1  ← Decrement
\`\`\`

### Accumulator Pattern
\`\`\`
sum = 0
sum = sum + value1
sum = sum + value2
sum = sum + value3
\`\`\`

### Swap Pattern (covered in next lesson)
\`\`\`
temp = a
a = b
b = temp
\`\`\`

### Flag Pattern
\`\`\`
found = false
if (item == target) {
  found = true
}
\`\`\`

## Variable Naming Conventions

### camelCase (JavaScript, Java)
\`\`\`
firstName
totalAmount
isUserLoggedIn
\`\`\`

### snake_case (Python, Ruby)
\`\`\`
first_name
total_amount
is_user_logged_in
\`\`\`

### PascalCase (Classes, Types)
\`\`\`
StudentRecord
UserAccount
ShoppingCart
\`\`\`

### UPPER_CASE (Constants)
\`\`\`
MAX_SIZE = 100
PI = 3.14159
DEFAULT_COLOR = "blue"
\`\`\`

## Type Conversion

Sometimes you need to convert between types:

### Number to String
\`\`\`
age = 25
ageText = "25"  ← String representation
\`\`\`

### String to Number
\`\`\`
input = "42"
number = 42  ← Numeric value
\`\`\`

### Implicit vs Explicit
Some languages convert automatically (implicit), others require explicit conversion.

## Variable Debugging Tips

### Print Variable Values
\`\`\`
Display "x = ", x
Display "Before: count = ", count
count = count + 1
Display "After: count = ", count
\`\`\`

### Track Changes
Use meaningful output to see how variables change:
\`\`\`
Display "Starting calculation..."
Display "Input: ", number
result = number * 2
Display "Result: ", result
\`\`\`

### Check Assumptions
Verify variables have expected values:
\`\`\`
if (age < 0) {
  Display "ERROR: Invalid age"
}
\`\`\`

## Memory Efficiency

### Reuse Variables
When appropriate, reuse variables instead of creating new ones:
\`\`\`
temp = a + b
result = temp * 2
\`\`\`

### Avoid Unnecessary Variables
Don't create variables you'll only use once:
\`\`\`
❌ Bad:
temp = a + b
result = temp

✅ Good:
result = a + b
\`\`\`

## Key Takeaways

1. Variables are named memory locations
2. Always initialize before use
3. Use descriptive names
4. Understand assignment vs comparison
5. Track variable changes during execution
6. Choose appropriate data types
7. Follow naming conventions
8. Debug by printing variable values
    `
  },
  {
    id: 6,
    title: "Assignment Operations",
    description: "Master the art of assigning and updating values",
    duration: "6 min read",
    category: 'basics',
    order: 6,
    section: "Section 2: Variables, Input and Output",
    subsection: "Subsection 4",
    content: `
# Assignment Operations

## The Assignment Operator

The assignment operator (=) stores a value in a variable. It's one of the most fundamental operations in programming.

### Basic Syntax
\`\`\`
variable = value
\`\`\`

### Important: Direction Matters!
\`\`\`
x = 5  ← Correct: Assigns 5 to x
5 = x  ← ERROR: Can't assign to a literal value
\`\`\`

## Types of Assignment

### Direct Assignment
Assigning a literal value:
\`\`\`
age = 25
name = "Alice"
isStudent = true
price = 19.99
\`\`\`

### Variable to Variable
Copying one variable's value to another:
\`\`\`
x = 10
y = x  ← y now has value 10 (copy of x)
\`\`\`

### Expression Assignment
Assigning the result of a calculation:
\`\`\`
sum = a + b
area = length * width
average = total / count
\`\`\`

### Self-Assignment
Updating a variable based on its current value:
\`\`\`
count = count + 1
total = total + price
score = score * 2
\`\`\`

## Assignment vs Equality

### Assignment (=)
Stores a value in a variable:
\`\`\`
x = 5  ← Makes x equal to 5
\`\`\`

### Equality Comparison (==)
Checks if two values are equal:
\`\`\`
if (x == 5)  ← Tests if x equals 5
\`\`\`

### Common Mistake
\`\`\`
❌ if (x = 5)  ← Assigns 5 to x (wrong!)
✅ if (x == 5) ← Compares x with 5 (correct!)
\`\`\`

## Compound Assignment Operators

Shorthand for common operations:

### Addition Assignment
\`\`\`
x = x + 5  ← Long form
x += 5     ← Short form (same result)
\`\`\`

### Subtraction Assignment
\`\`\`
x = x - 3
x -= 3  ← Equivalent
\`\`\`

### Multiplication Assignment
\`\`\`
x = x * 2
x *= 2  ← Equivalent
\`\`\`

### Division Assignment
\`\`\`
x = x / 4
x /= 4  ← Equivalent
\`\`\`

## Increment and Decrement

### Increment (Add 1)
\`\`\`
count = count + 1  ← Long form
count += 1         ← Medium form
count++            ← Short form (in some languages)
\`\`\`

### Decrement (Subtract 1)
\`\`\`
count = count - 1
count -= 1
count--
\`\`\`

## Multiple Assignments

### Sequential Assignment
\`\`\`
x = 5
y = 10
z = 15
\`\`\`

### Chain Assignment (some languages)
\`\`\`
x = y = z = 0  ← All three become 0
\`\`\`

## Assignment in Flowcharts

Use the **Process (Rectangle)** symbol:

\`\`\`
┌─────────────────┐
│   x = 10        │  ← Assignment
└─────────────────┘

┌─────────────────┐
│   sum = a + b   │  ← Expression assignment
└─────────────────┘

┌─────────────────┐
│   count = count + 1  │  ← Self-assignment
└─────────────────┘
\`\`\`

## Order of Operations

When assigning expressions, operations follow precedence rules:

\`\`\`
result = 2 + 3 * 4
\`\`\`

Steps:
1. Multiply: 3 * 4 = 12
2. Add: 2 + 12 = 14
3. Assign: result = 14

### Use Parentheses for Clarity
\`\`\`
result = (2 + 3) * 4  ← Forces addition first
Result: 20
\`\`\`

## Common Assignment Patterns

### Initialize-Update Pattern
\`\`\`
total = 0           ← Initialize
total = total + 10  ← Update
total = total + 20  ← Update again
\`\`\`

### Calculate-Store Pattern
\`\`\`
length = 5
width = 3
area = length * width  ← Calculate and store
\`\`\`

### Read-Process-Store Pattern
\`\`\`
Read temperature
celsius = temperature
fahrenheit = celsius * 9/5 + 32
Display fahrenheit
\`\`\`

## Assignment Errors to Avoid

### Uninitialized Variables
\`\`\`
❌ total = total + 10  ← What if total has no value?
✅ total = 0
   total = total + 10  ← Now it's safe
\`\`\`

### Wrong Direction
\`\`\`
❌ 10 = x  ← Can't assign to a number
✅ x = 10  ← Correct
\`\`\`

### Confusing = and ==
\`\`\`
❌ if (x = 10)  ← Assignment, not comparison
✅ if (x == 10) ← Comparison
\`\`\`

### Type Mismatches
\`\`\`
❌ age = "twenty-five"  ← String in numeric variable
✅ age = 25             ← Correct type
\`\`\`

## Best Practices

1. **Initialize First**: Give variables starting values
2. **Clear Names**: \`totalPrice\` not \`tp\`
3. **One Statement**: One assignment per line
4. **Comments**: Explain complex assignments
5. **Consistent Style**: Follow your language's conventions

## Practice Exercise

Create a flowchart that:
1. Initializes a counter to 0
2. Reads a number from user
3. Adds the number to counter
4. Displays the counter value
5. Increments counter by 1
6. Displays the final counter value

This exercise practices initialization, input, expression assignment, and self-assignment!
    `
  },
  {
    id: 7,
    title: "Swapping Variables",
    description: "Learn the classic technique of swapping two values",
    duration: "6 min read",
    category: 'basics',
    order: 7,
    section: "Section 2: Variables, Input and Output",
    subsection: "Subsection 5",
    content: `
# Swapping Variables

## The Swapping Problem

Imagine you have two glasses:
- Glass A contains orange juice
- Glass B contains apple juice

How do you swap their contents so that:
- Glass A contains apple juice
- Glass B contains orange juice

You can't pour both at once! You need a third glass.

## The Same Problem in Programming

Given two variables:
\`\`\`
a = 5
b = 10
\`\`\`

Goal: Swap their values so that:
\`\`\`
a = 10
b = 5
\`\`\`

## Why Swapping Matters

Swapping is used in:
- **Sorting algorithms**: Arranging data in order
- **Data manipulation**: Reorganizing information
- **Game development**: Switching player positions
- **Graphics**: Coordinate transformations

## The Wrong Way

### Attempt 1: Direct Swap
\`\`\`
a = 5
b = 10

a = b  ← a becomes 10
b = a  ← b becomes 10 (WRONG!)
\`\`\`

**Problem**: We lost the original value of \`a\` (which was 5)!

Result: Both variables are now 10. ❌

## The Right Way: Using a Temporary Variable

### The Three-Step Process

\`\`\`
a = 5
b = 10

Step 1: temp = a    ← Save a's value (temp = 5)
Step 2: a = b       ← Copy b to a (a = 10)
Step 3: b = temp    ← Copy saved value to b (b = 5)

Result: a = 10, b = 5 ✅
\`\`\`

### Visual Representation

\`\`\`
Initial State:
┌─────┬─────┬──────┐
│  a  │  b  │ temp │
├─────┼─────┼──────┤
│  5  │ 10  │  ?   │
└─────┴─────┴──────┘

After temp = a:
┌─────┬─────┬──────┐
│  a  │  b  │ temp │
├─────┼─────┼──────┤
│  5  │ 10  │  5   │ ← Saved a's value
└─────┴─────┴──────┘

After a = b:
┌─────┬─────┬──────┐
│  a  │  b  │ temp │
├─────┼─────┼──────┤
│ 10  │ 10  │  5   │ ← a now has b's value
└─────┴─────┴──────┘

After b = temp:
┌─────┬─────┬──────┐
│  a  │  b  │ temp │
├─────┼─────┼──────┤
│ 10  │  5  │  5   │ ← b now has original a's value
└─────┴─────┴──────┘

SWAPPED! ✅
\`\`\`

## Flowchart for Swapping

\`\`\`
START
  ↓
Read a
  ↓
Read b
  ↓
Display "Before: a =", a, "b =", b
  ↓
temp = a
  ↓
a = b
  ↓
b = temp
  ↓
Display "After: a =", a, "b =", b
  ↓
END
\`\`\`

## Complete Example

\`\`\`
Input:
a = 25
b = 50

Process:
temp = a      → temp = 25
a = b         → a = 50
b = temp      → b = 25

Output:
a = 50
b = 25
\`\`\`

## The Glass Analogy Revisited

\`\`\`
Glass A: Orange Juice (🍊)
Glass B: Apple Juice (🍎)
Glass C: Empty (temporary)

Step 1: Pour A into C  → C has 🍊
Step 2: Pour B into A  → A has 🍎
Step 3: Pour C into B  → B has 🍊

Result:
Glass A: 🍎 (Apple Juice)
Glass B: 🍊 (Orange Juice)
\`\`\`

## Alternative Methods

### Without Temporary Variable (Arithmetic)
\`\`\`
a = 5
b = 10

a = a + b    → a = 15
b = a - b    → b = 5
a = a - b    → a = 10
\`\`\`

**Caution**: Can cause overflow with large numbers!

### Without Temporary Variable (XOR - Advanced)
\`\`\`
a = a XOR b
b = a XOR b
a = a XOR b
\`\`\`

**Note**: Works only with integers, harder to understand.

**Recommendation**: Use the temporary variable method - it's clear, safe, and works with all data types!

## Common Mistakes

### Mistake 1: Wrong Order
\`\`\`
❌ a = b
   temp = a
   b = temp
\`\`\`
This doesn't work because we changed \`a\` before saving it!

### Mistake 2: Forgetting Temporary Variable
\`\`\`
❌ a = b
   b = a
\`\`\`
Both end up with the same value!

### Mistake 3: Reusing Variable Names
\`\`\`
❌ a = b
   b = a  ← This 'a' is already changed!
\`\`\`

## Practice Exercises

### Exercise 1: Basic Swap
Create a flowchart to swap two numbers entered by the user.

### Exercise 2: Three-Way Swap
Swap three variables: a → b, b → c, c → a

Hint: You'll need two temporary variables!

### Exercise 3: Conditional Swap
Swap two numbers only if the first is greater than the second.

## Real-World Application: Sorting

Swapping is fundamental to sorting algorithms:

\`\`\`
Array: [5, 2, 8, 1]

To sort, we swap elements:
[5, 2, 8, 1] → Swap 5 and 2
[2, 5, 8, 1] → Swap 8 and 1
[2, 5, 1, 8] → Swap 5 and 1
[2, 1, 5, 8] → Swap 2 and 1
[1, 2, 5, 8] → Sorted!
\`\`\`

## Key Takeaways

1. **Never swap directly** - you'll lose data
2. **Always use a temporary variable** - safest method
3. **Follow the three-step process** - temp = a, a = b, b = temp
4. **Test with examples** - verify your logic works
5. **Swapping is fundamental** - used in many algorithms

Remember: Like juggling, you need a third hand (temporary variable) to swap two items safely!
    `
  },

  // SECTION 3: ARITHMETIC OPERATIONS
  {
    id: 10,
    title: "Multiplication Operations",
    description: "Understanding multiplication in programming",
    duration: "5 min read",
    category: 'basics',
    order: 10,
    section: "Section 3: Arithmetic Operations",
    subsection: "Subsection 3",
    content: `# Multiplication Operations

Multiplication repeats addition. Instead of adding 5 three times (5+5+5), we multiply: 5 × 3 = 15.

## Syntax
\`\`\`
result = number1 * number2
\`\`\`

## Examples
- Area: \`area = length * width\`
- Total price: \`total = price * quantity\`
- Scaling: \`doubled = value * 2\`

## Properties
- Commutative: \`a * b = b * a\`
- Associative: \`(a * b) * c = a * (b * c)\`
- Identity: \`x * 1 = x\`
- Zero property: \`x * 0 = 0\`
`
  },
  {
    id: 11,
    title: "Division Operations",
    description: "Learn division and handling remainders",
    duration: "6 min read",
    category: 'basics',
    order: 11,
    section: "Section 3: Arithmetic Operations",
    subsection: "Subsection 4",
    content: `# Division Operations

Division splits a number into equal parts.

## Syntax
\`\`\`
result = number1 / number2
\`\`\`

## Types
- Integer division: \`10 / 3 = 3\` (whole number)
- Float division: \`10.0 / 3.0 = 3.333...\`
- Modulus (remainder): \`10 % 3 = 1\`

## Critical: Division by Zero
\`\`\`
❌ result = 10 / 0  → ERROR!
✅ if (divisor != 0) {
     result = number / divisor
   }
\`\`\`

## Common Uses
- Average: \`average = sum / count\`
- Split evenly: \`perPerson = total / people\`
- Convert units: \`meters = centimeters / 100\`
`
  },
  
  // SECTION 4: CONDITIONS
  {
    id: 12,
    title: "Relational Operators",
    description: "Compare values and make decisions",
    duration: "7 min read",
    category: 'logic',
    order: 12,
    section: "Section 4: Conditions and Relational Operators",
    subsection: "Subsection 1",
    content: `# Relational Operators

Relational operators compare two values and return true or false.

## The Six Operators

### Equal To (==)
\`\`\`
5 == 5  → true
5 == 3  → false
\`\`\`

### Not Equal To (!=)
\`\`\`
5 != 3  → true
5 != 5  → false
\`\`\`

### Greater Than (>)
\`\`\`
10 > 5  → true
5 > 10  → false
\`\`\`

### Less Than (<)
\`\`\`
5 < 10  → true
10 < 5  → false
\`\`\`

### Greater Than or Equal (>=)
\`\`\`
10 >= 10  → true
10 >= 5   → true
5 >= 10   → false
\`\`\`

### Less Than or Equal (<=)
\`\`\`
5 <= 10  → true
5 <= 5   → true
10 <= 5  → false
\`\`\`

## In Flowcharts
Use the **Decision (Diamond)** symbol:
\`\`\`
    ┌─────────┐
    │ x > 10? │
    └────┬────┘
      Yes│  │No
\`\`\`

## Logical Operators

### AND (&&)
Both conditions must be true:
\`\`\`
(age >= 18) AND (hasLicense == true)
\`\`\`

### OR (||)
At least one condition must be true:
\`\`\`
(day == "Saturday") OR (day == "Sunday")
\`\`\`

### NOT (!)
Reverses the condition:
\`\`\`
NOT (isRaining)  → true if not raining
\`\`\`

## Real Examples
- Age check: \`if (age >= 18)\`
- Password match: \`if (input == password)\`
- Range check: \`if (score >= 0 AND score <= 100)\`
- Eligibility: \`if (age >= 18 AND citizen == true)\`
`
  },
  
  // SECTION 5: LOOPS
  {
    id: 13,
    title: "Introduction to Loops",
    description: "Repeat actions efficiently with loops",
    duration: "10 min read",
    category: 'logic',
    order: 13,
    section: "Section 5: Loops",
    subsection: "Subsection 1",
    content: `# Introduction to Loops

Loops allow you to repeat code without writing it multiple times.

## Why Loops?

Without loops:
\`\`\`
Display 1
Display 2
Display 3
...
Display 100  ← Tedious!
\`\`\`

With loops:
\`\`\`
for i = 1 to 100 {
  Display i
}
\`\`\`

## Types of Loops

### FOR Loop
When you know how many times to repeat:
\`\`\`
for i = 1 to 10 {
  Display i
}
\`\`\`

### WHILE Loop
Repeat while a condition is true:
\`\`\`
count = 0
while (count < 10) {
  Display count
  count = count + 1
}
\`\`\`

### DO-WHILE Loop
Execute at least once, then check condition:
\`\`\`
do {
  Display "Enter password"
  Read password
} while (password != correct)
\`\`\`

## Loop Components

1. **Initialization**: Set starting values
2. **Condition**: When to continue
3. **Body**: Code to repeat
4. **Update**: Change values each iteration

## Loop Patterns

### Counting Up
\`\`\`
for i = 1 to 10 {
  Display i
}
→ 1, 2, 3, ..., 10
\`\`\`

### Counting Down
\`\`\`
for i = 10 to 1 step -1 {
  Display i
}
→ 10, 9, 8, ..., 1
\`\`\`

### Accumulation
\`\`\`
sum = 0
for i = 1 to 10 {
  sum = sum + i
}
→ sum = 55
\`\`\`

### Search
\`\`\`
found = false
for each item in list {
  if (item == target) {
    found = true
  }
}
\`\`\`

## Infinite Loops (Avoid!)

❌ Bad:
\`\`\`
while (true) {
  Display "Forever"
}
\`\`\`

✅ Good:
\`\`\`
count = 0
while (count < 10) {
  Display count
  count = count + 1  ← Don't forget to update!
}
\`\`\`

## Loop Control

### Break
Exit the loop early:
\`\`\`
for i = 1 to 100 {
  if (found) {
    break  ← Exit loop
  }
}
\`\`\`

### Continue
Skip to next iteration:
\`\`\`
for i = 1 to 10 {
  if (i == 5) {
    continue  ← Skip 5
  }
  Display i
}
\`\`\`

## Real-World Examples

### Sum of Numbers
\`\`\`
sum = 0
for i = 1 to 100 {
  sum = sum + i
}
Display "Sum:", sum
\`\`\`

### Factorial
\`\`\`
factorial = 1
for i = 1 to n {
  factorial = factorial * i
}
\`\`\`

### Input Validation
\`\`\`
valid = false
while (NOT valid) {
  Read input
  if (input >= 0 AND input <= 100) {
    valid = true
  } else {
    Display "Invalid! Try again"
  }
}
\`\`\`
`
  },
  
  // SECTION 6: NESTED LOOPS
  {
    id: 14,
    title: "Nested Loops",
    description: "Loops within loops for complex patterns",
    duration: "8 min read",
    category: 'advanced',
    order: 14,
    section: "Section 6: Nested Loops",
    subsection: "Subsection 1",
    content: `# Nested Loops

A nested loop is a loop inside another loop. The inner loop completes all its iterations for each iteration of the outer loop.

## Basic Structure

\`\`\`
for i = 1 to 3 {
  for j = 1 to 2 {
    Display i, j
  }
}

Output:
1 1
1 2
2 1
2 2
3 1
3 2
\`\`\`

## How It Works

Outer loop runs once → Inner loop runs completely
Outer loop runs again → Inner loop runs completely again

Think of it like a clock:
- Outer loop = hours
- Inner loop = minutes
- For each hour, all 60 minutes pass

## Pattern Printing

### Rectangle of Stars
\`\`\`
for row = 1 to 3 {
  for col = 1 to 5 {
    Display "*"
  }
  Display newline
}

Output:
*****
*****
*****
\`\`\`

### Multiplication Table
\`\`\`
for i = 1 to 5 {
  for j = 1 to 5 {
    Display i * j
  }
  Display newline
}
\`\`\`

### Triangle Pattern
\`\`\`
for i = 1 to 5 {
  for j = 1 to i {
    Display "*"
  }
  Display newline
}

Output:
*
**
***
****
*****
\`\`\`

## 2D Arrays

Nested loops are perfect for processing 2D data:

\`\`\`
for row = 0 to rows-1 {
  for col = 0 to cols-1 {
    Process array[row][col]
  }
}
\`\`\`

## Performance Consideration

Nested loops multiply iterations:
- Outer: 100 iterations
- Inner: 100 iterations
- Total: 100 × 100 = 10,000 iterations!

Be careful with large nested loops.

## Common Patterns

### Sum of 2D Array
\`\`\`
sum = 0
for i = 0 to rows-1 {
  for j = 0 to cols-1 {
    sum = sum + array[i][j]
  }
}
\`\`\`

### Find Maximum in 2D Array
\`\`\`
max = array[0][0]
for i = 0 to rows-1 {
  for j = 0 to cols-1 {
    if (array[i][j] > max) {
      max = array[i][j]
    }
  }
}
\`\`\`
`
  },
  
  // SECTION 7: ARRAYS
  {
    id: 15,
    title: "Introduction to Arrays",
    description: "Store and manage collections of data",
    duration: "10 min read",
    category: 'advanced',
    order: 15,
    section: "Section 7: Arrays",
    subsection: "Subsection 1",
    content: `# Introduction to Arrays

An array is a collection of elements stored in contiguous memory locations. Think of it as a row of numbered boxes, each holding a value.

## What is an Array?

Instead of:
\`\`\`
score1 = 85
score2 = 92
score3 = 78
score4 = 95
score5 = 88
\`\`\`

Use an array:
\`\`\`
scores = [85, 92, 78, 95, 88]
\`\`\`

## Array Basics

### Declaration
\`\`\`
numbers = [1, 2, 3, 4, 5]
names = ["Alice", "Bob", "Charlie"]
\`\`\`

### Accessing Elements
Arrays use **zero-based indexing**:
\`\`\`
numbers = [10, 20, 30, 40, 50]
           ↑   ↑   ↑   ↑   ↑
Index:     0   1   2   3   4

numbers[0] → 10
numbers[2] → 30
numbers[4] → 50
\`\`\`

### Modifying Elements
\`\`\`
numbers[1] = 25
→ [10, 25, 30, 40, 50]
\`\`\`

### Array Length
\`\`\`
length = numbers.length  → 5
\`\`\`

## Looping Through Arrays

### Using FOR Loop
\`\`\`
for i = 0 to length-1 {
  Display numbers[i]
}
\`\`\`

### Using FOR-EACH Loop
\`\`\`
for each number in numbers {
  Display number
}
\`\`\`

## Common Array Operations

### Sum of Array
\`\`\`
sum = 0
for i = 0 to length-1 {
  sum = sum + array[i]
}
\`\`\`

### Find Maximum
\`\`\`
max = array[0]
for i = 1 to length-1 {
  if (array[i] > max) {
    max = array[i]
  }
}
\`\`\`

### Search for Element
\`\`\`
found = false
for i = 0 to length-1 {
  if (array[i] == target) {
    found = true
    position = i
  }
}
\`\`\`

### Reverse Array
\`\`\`
for i = 0 to length/2-1 {
  temp = array[i]
  array[i] = array[length-1-i]
  array[length-1-i] = temp
}
\`\`\`

## Multi-Dimensional Arrays

### 2D Array (Matrix)
\`\`\`
matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
]

matrix[0][0] → 1
matrix[1][2] → 6
matrix[2][1] → 8
\`\`\`

### Accessing 2D Arrays
\`\`\`
for row = 0 to rows-1 {
  for col = 0 to cols-1 {
    Display matrix[row][col]
  }
}
\`\`\`

## Array Advantages

✅ Store multiple values in one variable
✅ Easy to loop through data
✅ Efficient memory usage
✅ Organize related data together

## Common Mistakes

❌ Index out of bounds:
\`\`\`
array = [1, 2, 3]
value = array[5]  ← ERROR! Only indices 0-2 exist
\`\`\`

❌ Forgetting zero-based indexing:
\`\`\`
First element is array[0], not array[1]!
\`\`\`

❌ Not checking array length:
\`\`\`
✅ for i = 0 to length-1  (Correct)
❌ for i = 0 to length    (Goes one too far!)
\`\`\`

## Real-World Uses

- Student grades: \`grades = [85, 90, 78, 92]\`
- Shopping cart: \`items = ["apple", "bread", "milk"]\`
- Temperature readings: \`temps = [72, 75, 68, 70]\`
- Game scores: \`highScores = [1000, 950, 900]\`

Arrays are fundamental to programming - master them!
`
  }
];
