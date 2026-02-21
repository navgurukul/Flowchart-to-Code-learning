# 🚀 FlowchartAR Code - NavGurukul Package

## Your Project Settings
```
Name: FlowchartAR
Package: org.navgurukul.org
Language: Kotlin
Minimum SDK: API 24
```

---

## 📁 File Structure

```
app/src/main/java/org/navgurukul/org/
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
│       └── (auto-generated)
├── ar/
│   ├── ARManager.kt
│   └── ShapeRenderer.kt
└── utils/
    └── PermissionHelper.kt
```

---

## 📝 Step 1: Add Dependencies

**File:** `app/build.gradle.kts`

Find the `dependencies` block and add:

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
    
    // 🆕 ADD THESE:
    implementation("com.google.ar:core:1.41.0")
    implementation("io.github.sceneview:arsceneview:2.0.3")
    implementation("androidx.compose.material:material-icons-extended:1.6.0")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.navigation:navigation-compose:2.7.6")
}
```

**Click "Sync Now"** after adding!

---

## 📝 Step 2: Update AndroidManifest.xml

**File:** `app/src/main/AndroidManifest.xml`

Replace entire file:

```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools">

    <uses-permission android:name="android.permission.CAMERA" />
    <uses-feature
        android:name="android.hardware.camera.ar"
        android:required="true" />
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

## 📝 Step 3: Create Models

### File 1: ShapeType.kt

**Location:** Right-click `org.navgurukul.org` → New → Package → name it `models`  
Then: Right-click `models` → New → Kotlin Class/File → Select "File" → name it `ShapeType`

```kotlin
package org.navgurukul.org.models

enum class ShapeType {
    START_END,      // Oval/Terminal
    PROCESS,        // Rectangle
    DECISION,       // Diamond
    INPUT_OUTPUT    // Parallelogram
}
```

### File 2: FlowchartShape.kt

**Location:** Right-click `models` → New → Kotlin Class/File → Select "File" → name it `FlowchartShape`

```kotlin
package org.navgurukul.org.models

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

object ShapeRepository {
    fun getAllShapes(): List<FlowchartShape> = listOf(
        FlowchartShape(
            id = 1,
            name = "Start/End",
            type = ShapeType.START_END,
            description = "Terminal symbol - marks the beginning or end of a flowchart",
            color = Color(0xFF4CAF50),
            usage = "Use at the start and end of every flowchart",
            examples = listOf("START", "END", "BEGIN", "STOP")
        ),
        FlowchartShape(
            id = 2,
            name = "Process",
            type = ShapeType.PROCESS,
            description = "Rectangle - represents operations, calculations, or assignments",
            color = Color(0xFF2196F3),
            usage = "Use for any processing step or calculation",
            examples = listOf("sum = a + b", "count = count + 1", "x = x * 2")
        ),
        FlowchartShape(
            id = 3,
            name = "Decision",
            type = ShapeType.DECISION,
            description = "Diamond - represents yes/no questions or conditions",
            color = Color(0xFFFFC107),
            usage = "Use for conditions, comparisons, or branching logic",
            examples = listOf("x > 10?", "Is valid?", "count == 0?")
        ),
        FlowchartShape(
            id = 4,
            name = "Input/Output",
            type = ShapeType.INPUT_OUTPUT,
            description = "Parallelogram - represents data input or output",
            color = Color(0xFF9C27B0),
            usage = "Use for reading input or displaying output",
            examples = listOf("Read number", "Display result", "Input name")
        )
    )
}
```

---

## 📝 Step 4: Create UI Components

### File 3: ShapeCard.kt

**Location:** Create packages: `ui` → `components`  
Then: Right-click `components` → New → Kotlin Class/File → Select "File" → name it `ShapeCard`

```kotlin
package org.navgurukul.org.ui.components

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
import org.navgurukul.org.models.FlowchartShape

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

---

## 📝 Step 5: Create Screens

### File 4: ShapeListScreen.kt

**Location:** Create package: `ui` → `screens`  
Then: Right-click `screens` → New → Kotlin Class/File → Select "File" → name it `ShapeListScreen`

```kotlin
package org.navgurukul.org.ui.screens

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
import org.navgurukul.org.models.FlowchartShape
import org.navgurukul.org.models.ShapeRepository
import org.navgurukul.org.ui.components.ShapeCard

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
                
                item {
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }
        }
    }
}
```

### File 5: ARViewScreen.kt

**Location:** Right-click `screens` → New → Kotlin Class/File → Select "File" → name it `ARViewScreen`

```kotlin
package org.navgurukul.org.ui.screens

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
import org.navgurukul.org.models.FlowchartShape

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ARViewScreen(
    shape: FlowchartShape,
    onBack: () -> Unit,
    modifier: Modifier = Modifier
) {
    var hasPlacedShape by remember { mutableStateOf(false) }
    
    Box(modifier = modifier.fillMaxSize()) {
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

## 📝 Step 6: Update MainActivity

**File:** `app/src/main/java/org/navgurukul/org/MainActivity.kt`

Replace entire file:

```kotlin
package org.navgurukul.org

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import org.navgurukul.org.models.FlowchartShape
import org.navgurukul.org.ui.screens.ARViewScreen
import org.navgurukul.org.ui.screens.ShapeListScreen
import org.navgurukul.org.ui.theme.FlowchartARTheme

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
        ShapeListScreen(
            onShapeSelected = { shape ->
                selectedShape = shape
            }
        )
    } else {
        ARViewScreen(
            shape = selectedShape!!,
            onBack = { selectedShape = null }
        )
    }
}
```

---

## ▶️ Step 7: Run Your App!

### Connect Your Phone:
1. Enable Developer Options:
   - Settings → About Phone
   - Tap "Build Number" 7 times
   - Go back → Developer Options
   - Enable "USB Debugging"

2. Connect via USB

3. Click green ▶️ "Run" button in Android Studio

---

## ✅ What You Should See:

1. **Shape List Screen** with 4 colorful cards
2. Tap any shape → Opens AR View (placeholder)
3. Back button works

---

## 🐛 Quick Fixes:

### If you see "Unresolved reference: FlowchartARTheme"
Change this line in MainActivity:
```kotlin
FlowchartARTheme {
```
To:
```kotlin
MaterialTheme {
```

### If Gradle sync fails:
1. File → Invalidate Caches → Restart
2. Check internet connection

### If app crashes:
1. Check Logcat (bottom panel)
2. Build → Clean Project
3. Build → Rebuild Project

---

## 🎉 Success!

Once you see the shape list on your phone, you're ready for the next step: adding the AR camera!

Let me know when it's working! 📱✨
