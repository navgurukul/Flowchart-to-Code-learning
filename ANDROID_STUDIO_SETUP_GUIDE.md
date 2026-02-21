# 🚀 Android Studio Setup Guide - Flowchart AR App

## Step-by-Step Guide to Create Your AR Project

---

## 📋 Prerequisites

### 1. Install Android Studio
- Download from: https://developer.android.com/studio
- Install latest stable version (Hedgehog 2023.1.1 or newer)
- Make sure you have at least 8GB RAM and 10GB free disk space

### 2. Install Required Components
During Android Studio installation, make sure these are checked:
- ✅ Android SDK
- ✅ Android SDK Platform
- ✅ Android Virtual Device (for testing)

---

## 🎬 Step 1: Create New Project

### 1.1 Open Android Studio
- Launch Android Studio
- Click **"New Project"** (or File → New → New Project)

### 1.2 Choose Template
```
Select: "Empty Activity"
(NOT "Empty Views Activity" - we want Compose)
```

**Why Empty Activity?**
- Clean starting point
- Includes Jetpack Compose (modern UI)
- No unnecessary boilerplate

### 1.3 Configure Your Project

Fill in these details:

```
Name: FlowchartAR
Package name: com.flowchart.ar
Save location: [Choose your preferred folder]
Language: Kotlin ✅
Minimum SDK: API 24 ("Nougat"; Android 7.0)
Build configuration language: Kotlin DSL (build.gradle.kts) ✅
```

**Important Settings:**
- ✅ Language: **Kotlin** (NOT Java)
- ✅ Minimum SDK: **API 24** (covers 95%+ devices)
- ✅ Build: **Kotlin DSL** (modern approach)

### 1.4 Click "Finish"
- Android Studio will create your project
- Wait for Gradle sync to complete (2-5 minutes)
- You'll see "BUILD SUCCESSFUL" in the bottom panel

---

## 🔧 Step 2: Configure Project for AR

### 2.1 Open `build.gradle.kts` (Module: app)

**Location:** `app/build.gradle.kts`

Find the `dependencies` block and add these:

```kotlin
dependencies {
    // Existing dependencies (keep these)
    implementation("androidx.core:core-ktx:1.12.0")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.7.0")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-graphics")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    
    // 🆕 ADD THESE FOR AR:
    
    // ARCore - Google's AR platform
    implementation("com.google.ar:core:1.41.0")
    
    // SceneView - Easy AR/3D rendering
    implementation("io.github.sceneview:arsceneview:2.0.3")
    
    // Material Icons Extended (for UI icons)
    implementation("androidx.compose.material:material-icons-extended:1.6.0")
    
    // Coroutines for async operations
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // ViewModel for Compose
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    
    // Navigation for Compose
    implementation("androidx.navigation:navigation-compose:2.7.6")
}
```

**After adding, click:** "Sync Now" (top right banner)

### 2.2 Update `AndroidManifest.xml`

**Location:** `app/src/main/AndroidManifest.xml`

Replace the entire file with this:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <!-- Camera permission for AR -->
    <uses-permission android:name="android.permission.CAMERA" />
    
    <!-- AR feature requirement -->
    <uses-feature
        android:name="android.hardware.camera.ar"
        android:required="true" />
    
    <!-- Internet permission (optional, for future features) -->
    <uses-permission android:name="android.permission.INTERNET" />

    <application
        android:allowBackup="true"
        android:dataExtractionRules="@xml/data_extraction_rules"
        android:fullBackupContent="@xml/backup_rules"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.FlowchartAR"
        tools:targetApi="31">
        
        <!-- ARCore requirement -->
        <meta-data
            android:name="com.google.ar.core"
            android:value="required" />
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:screenOrientation="portrait"
            android:theme="@style/Theme.FlowchartAR">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>

</manifest>
```

---

## 📁 Step 3: Create Project Structure

### 3.1 Create Package Structure

Right-click on `com.flowchart.ar` → New → Package

Create these packages:
```
com.flowchart.ar.models
com.flowchart.ar.ui
com.flowchart.ar.ui.screens
com.flowchart.ar.ui.components
com.flowchart.ar.ar
com.flowchart.ar.utils
```

**Your structure should look like:**
```
app/src/main/java/com/flowchart/ar/
├── MainActivity.kt
├── models/
│   ├── FlowchartShape.kt
│   └── ShapeType.kt
├── ui/
│   ├── screens/
│   │   ├── ShapeListScreen.kt
│   │   └── ARViewScreen.kt
│   ├── components/
│   │   └── ShapeCard.kt
│   └── theme/
│       └── (auto-generated theme files)
├── ar/
│   ├── ARManager.kt
│   └── ShapeRenderer.kt
└── utils/
    └── PermissionHelper.kt
```

---

## 📝 Step 4: Create Data Models

### 4.1 Create ShapeType.kt

**Location:** `app/src/main/java/com/flowchart/ar/models/ShapeType.kt`

Right-click on `models` package → New → Kotlin Class/File → Select "File"

```kotlin
package com.flowchart.ar.models

enum class ShapeType {
    START_END,      // Oval/Terminal
    PROCESS,        // Rectangle
    DECISION,       // Diamond
    INPUT_OUTPUT    // Parallelogram
}
```

### 4.2 Create FlowchartShape.kt

**Location:** `app/src/main/java/com/flowchart/ar/models/FlowchartShape.kt`

```kotlin
package com.flowchart.ar.models

import androidx.compose.ui.graphics.Color

data class FlowchartShape(
    val id: Int,
    val name: String,
    val type: ShapeType,
    val description: String,
    val color: Color,
    val usage: String,
    val examples: List<String>
)

// Repository with all shapes
object ShapeRepository {
    fun getAllShapes(): List<FlowchartShape> = listOf(
        FlowchartShape(
            id = 1,
            name = "Start/End",
            type = ShapeType.START_END,
            description = "Terminal symbol - marks the beginning or end of a flowchart",
            color = Color(0xFF4CAF50), // Green
            usage = "Use at the start and end of every flowchart",
            examples = listOf("START", "END", "BEGIN", "STOP")
        ),
        FlowchartShape(
            id = 2,
            name = "Process",
            type = ShapeType.PROCESS,
            description = "Rectangle - represents operations, calculations, or assignments",
            color = Color(0xFF2196F3), // Blue
            usage = "Use for any processing step or calculation",
            examples = listOf("sum = a + b", "count = count + 1", "x = x * 2")
        ),
        FlowchartShape(
            id = 3,
            name = "Decision",
            type = ShapeType.DECISION,
            description = "Diamond - represents yes/no questions or conditions",
            color = Color(0xFFFFC107), // Yellow/Orange
            usage = "Use for conditions, comparisons, or branching logic",
            examples = listOf("x > 10?", "Is valid?", "count == 0?")
        ),
        FlowchartShape(
            id = 4,
            name = "Input/Output",
            type = ShapeType.INPUT_OUTPUT,
            description = "Parallelogram - represents data input or output",
            color = Color(0xFF9C27B0), // Purple
            usage = "Use for reading input or displaying output",
            examples = listOf("Read number", "Display result", "Input name")
        )
    )
}
```

---

## 🎨 Step 5: Create UI Screens

### 5.1 Create ShapeCard.kt (Component)

**Location:** `app/src/main/java/com/flowchart/ar/ui/components/ShapeCard.kt`

```kotlin
package com.flowchart.ar.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ViewInAr
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import com.flowchart.ar.models.FlowchartShape

@Composable
fun ShapeCard(
    shape: FlowchartShape,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp),
        shape = RoundedCornerShape(12.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Left side: Shape info
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = shape.name,
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = shape.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Color.Gray
                )
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "💡 ${shape.usage}",
                    style = MaterialTheme.typography.bodySmall,
                    fontStyle = FontStyle.Italic,
                    color = Color.DarkGray
                )
                Spacer(modifier = Modifier.height(8.dp))
                // Example tag
                Surface(
                    color = shape.color.copy(alpha = 0.2f),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(
                        text = "Example: ${shape.examples.first()}",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = shape.color
                    )
                }
            }
            
            // Right side: AR icon with color indicator
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .background(
                            color = shape.color.copy(alpha = 0.2f),
                            shape = RoundedCornerShape(12.dp)
                        ),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.ViewInAr,
                        contentDescription = "View in AR",
                        modifier = Modifier.size(40.dp),
                        tint = shape.color
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = "View in AR",
                    style = MaterialTheme.typography.labelSmall,
                    color = shape.color
                )
            }
        }
    }
}
```

### 5.2 Create ShapeListScreen.kt

**Location:** `app/src/main/java/com/flowchart/ar/ui/screens/ShapeListScreen.kt`

```kotlin
package com.flowchart.ar.ui.screens

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.runtime.remember
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.flowchart.ar.models.FlowchartShape
import com.flowchart.ar.models.ShapeRepository
import com.flowchart.ar.ui.components.ShapeCard

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ShapeListScreen(
    onShapeSelected: (FlowchartShape) -> Unit,
    modifier: Modifier = Modifier
) {
    val shapes = remember { ShapeRepository.getAllShapes() }
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Column {
                        Text(
                            text = "Flowchart Shapes",
                            style = MaterialTheme.typography.titleLarge,
                            fontWeight = FontWeight.Bold
                        )
                        Text(
                            text = "Learn in Augmented Reality",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { padding ->
        Column(
            modifier = modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Header card
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "📱 Welcome to AR Learning!",
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Tap any shape below to view it in 3D using your camera. " +
                                "You'll be able to place it in your room and walk around it!",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Start
                    )
                }
            }
            
            // Shape list
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(shapes) { shape ->
                    ShapeCard(
                        shape = shape,
                        onClick = { onShapeSelected(shape) }
                    )
                }
                
                // Footer spacing
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}
```

### 5.3 Create ARViewScreen.kt (Placeholder for now)

**Location:** `app/src/main/java/com/flowchart/ar/ui/screens/ARViewScreen.kt`

```kotlin
package com.flowchart.ar.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.flowchart.ar.models.FlowchartShape

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ARViewScreen(
    shape: FlowchartShape,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var hasPlacedShape by remember { mutableStateOf(false) }
    
    Box(modifier = modifier.fillMaxSize()) {
        // AR View will go here (we'll add this in next steps)
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(Color.Black),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = "📷 AR Camera View\n(Coming in next step)",
                color = Color.White,
                textAlign = TextAlign.Center,
                style = MaterialTheme.typography.headlineMedium
            )
        }
        
        // Top bar
        TopAppBar(
            title = { Text(shape.name) },
            navigationIcon = {
                IconButton(onClick = onBack) {
                    Icon(
                        imageVector = Icons.Default.ArrowBack,
                        contentDescription = "Back",
                        tint = Color.White
                    )
                }
            },
            colors = TopAppBarDefaults.topAppBarColors(
                containerColor = Color.Transparent,
                titleContentColor = Color.White
            )
        )
        
        // Instructions overlay
        if (!hasPlacedShape) {
            Card(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
                    .fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = Color.Black.copy(alpha = 0.7f)
                )
            ) {
                Column(
                    modifier = Modifier.padding(16.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "📱 Point your camera at a flat surface",
                        color = Color.White,
                        style = MaterialTheme.typography.bodyLarge,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(
                        text = "Tap to place the ${shape.name} shape",
                        color = Color.White.copy(alpha = 0.8f),
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center
                    )
                    Spacer(modifier = Modifier.height(12.dp))
                    Button(
                        onClick = { hasPlacedShape = true },
                        colors = ButtonDefaults.buttonColors(
                            containerColor = shape.color
                        )
                    ) {
                        Text("Got it!")
                    }
                }
            }
        }
    }
}
```

---

## 🎯 Step 6: Update MainActivity

**Location:** `app/src/main/java/com/flowchart/ar/MainActivity.kt`

Replace the entire file with:

```kotlin
package com.flowchart.ar

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import com.flowchart.ar.models.FlowchartShape
import com.flowchart.ar.ui.screens.ARViewScreen
import com.flowchart.ar.ui.screens.ShapeListScreen
import com.flowchart.ar.ui.theme.FlowchartARTheme

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            FlowchartARTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    FlowchartARApp()
                }
            }
        }
    }
}

@Composable
fun FlowchartARApp() {
    var selectedShape by remember { mutableStateOf<FlowchartShape?>(null) }
    
    if (selectedShape == null) {
        // Show shape list
        ShapeListScreen(
            onShapeSelected = { shape ->
                selectedShape = shape
            }
        )
    } else {
        // Show AR view
        ARViewScreen(
            shape = selectedShape!!,
            onBack = { selectedShape = null }
        )
    }
}
```

---

## ▶️ Step 7: Run Your App!

### 7.1 Connect Your Android Phone

**Option A: Physical Device (Recommended for AR)**
1. Enable Developer Options on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"
2. Connect phone via USB
3. Allow USB debugging when prompted

**Option B: Emulator (Limited AR support)**
- Click "Device Manager" in Android Studio
- Create new virtual device
- Choose Pixel 6 or newer
- Select system image with Google APIs

### 7.2 Run the App
1. Click the green ▶️ "Run" button (or press Shift+F10)
2. Select your device
3. Wait for build to complete
4. App will launch on your device!

---

## ✅ What You Should See

### On First Launch:
1. **Shape List Screen** with 4 cards:
   - Start/End (Green)
   - Process (Blue)
   - Decision (Yellow)
   - Input/Output (Purple)

2. **Tap any shape** → Opens AR View Screen (placeholder for now)

3. **Back button** → Returns to shape list

---

## 🎉 Success Checklist

- [ ] Project created successfully
- [ ] All dependencies added and synced
- [ ] AndroidManifest.xml updated
- [ ] All model files created
- [ ] All UI screens created
- [ ] MainActivity updated
- [ ] App runs without errors
- [ ] Can see shape list
- [ ] Can navigate to AR view
- [ ] Back button works

---

## 🐛 Common Issues & Fixes

### Issue 1: "Unresolved reference: FlowchartARTheme"
**Fix:** The theme is auto-generated. If missing:
1. Go to `ui/theme/Theme.kt`
2. Make sure the theme name matches your app name
3. Or change `FlowchartARTheme` to `MaterialTheme` in MainActivity

### Issue 2: Gradle sync failed
**Fix:**
1. File → Invalidate Caches → Invalidate and Restart
2. Check internet connection
3. Update Android Studio to latest version

### Issue 3: App crashes on launch
**Fix:**
1. Check Logcat (bottom panel) for error messages
2. Make sure all package names match
3. Clean and rebuild: Build → Clean Project → Rebuild Project

### Issue 4: Icons not showing
**Fix:** Add this to dependencies:
```kotlin
implementation("androidx.compose.material:material-icons-extended:1.6.0")
```

---

## 📚 Next Steps

After completing this setup:

1. ✅ **You have a working app with shape list**
2. 🔜 **Next:** Add AR camera functionality (I'll guide you)
3. 🔜 **Then:** Add 3D shape rendering
4. 🔜 **Finally:** Add gestures (rotate, scale, move)

---

## 💬 Need Help?

If you get stuck:
1. Check the error message in Logcat (bottom panel)
2. Make sure all file names and package names match exactly
3. Try Clean Project → Rebuild Project
4. Share the error message and I'll help you fix it!

---

**Ready to continue? Let me know when you've completed these steps and I'll guide you through adding the AR camera! 🚀**
