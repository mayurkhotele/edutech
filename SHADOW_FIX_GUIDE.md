# Android Shadow Fix Guide

## समस्या (Problem)
Android devices पर shadows अलग तरीके से render होते हैं और कभी-कभी सभी sides पर shadow दिखाई देता है, जबकि iOS पर सही तरीके से दिखता है।

## समाधान (Solution)

### 1. ShadowUtils का उपयोग करें
```typescript
import { ShadowUtils } from '@/utils/shadowUtils';

// Basic shadow
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    ...ShadowUtils.cardShadow(), // Platform-specific shadow
  }
});
```

### 2. Platform-specific Shadow Properties

#### iOS के लिए:
- `shadowColor` - Shadow का color
- `shadowOffset` - Shadow का position
- `shadowOpacity` - Shadow की transparency
- `shadowRadius` - Shadow का blur radius

#### Android के लिए:
- `elevation` - Shadow की depth (0-24)
- `shadowColor` - Shadow का color (optional)

### 3. Common Shadow Types

```typescript
// Light shadow for cards
...ShadowUtils.cardShadow()

// Medium shadow for buttons
...ShadowUtils.buttonShadow()

// Heavy shadow for modals
...ShadowUtils.modalShadow()

// Colored shadow
...ShadowUtils.coloredShadow('#4F46E5', 0.2)

// Glow effect
...ShadowUtils.glowShadow('#10B981', 0.3)
```

### 4. Manual Shadow Fix

अगर आप manually fix करना चाहते हैं:

```typescript
import { Platform } from 'react-native';

const shadowStyle = Platform.OS === 'ios' ? {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
} : {
  elevation: 2,
  shadowColor: '#000',
};
```

### 5. Common Issues और Solutions

#### Issue 1: Android पर सभी sides पर shadow
**Solution:** `elevation` का सही उपयोग करें
```typescript
// ❌ Wrong
elevation: 10,
shadowOffset: { width: 2, height: 2 },

// ✅ Correct
elevation: 2,
shadowOffset: { width: 0, height: 0 },
```

#### Issue 2: Shadow बहुत dark है
**Solution:** `elevation` कम करें और `shadowColor` adjust करें
```typescript
elevation: 1, // कम करें
shadowColor: 'rgba(0, 0, 0, 0.1)', // Light करें
```

#### Issue 3: iOS पर shadow नहीं दिख रहा
**Solution:** `shadowOpacity` और `shadowRadius` check करें
```typescript
shadowOpacity: 0.2, // Increase करें
shadowRadius: 8, // Increase करें
```

### 6. Best Practices

1. **Consistent Shadows:** सभी components में same shadow pattern use करें
2. **Platform Testing:** हमेशा दोनों platforms पर test करें
3. **Performance:** ज्यादा `elevation` values avoid करें (Android पर performance impact)
4. **Accessibility:** High contrast mode में shadows properly work करें

### 7. Migration Steps

1. **Import ShadowUtils:**
```typescript
import { ShadowUtils } from '@/utils/shadowUtils';
```

2. **Replace existing shadows:**
```typescript
// Before
shadowColor: '#000',
shadowOffset: { width: 0, height: 2 },
shadowOpacity: 0.1,
shadowRadius: 4,
elevation: 2,

// After
...ShadowUtils.cardShadow(),
```

3. **Test on both platforms**

### 8. Example Components

#### Card Component:
```typescript
const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    ...ShadowUtils.cardShadow(),
  }
});
```

#### Button Component:
```typescript
const styles = StyleSheet.create({
  button: {
    backgroundColor: '#4F46E5',
    borderRadius: 8,
    padding: 12,
    ...ShadowUtils.buttonShadow(),
  }
});
```

#### Modal Component:
```typescript
const styles = StyleSheet.create({
  modal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    ...ShadowUtils.modalShadow(),
  }
});
```

## नोट (Note)
यह guide आपके app में consistent shadows ensure करेगा और Android/iOS दोनों पर proper rendering guarantee करेगा।
