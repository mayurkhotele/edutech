# Global Font System Migration Guide

## Overview
We've created a centralized font system that can be used throughout the entire application. This eliminates the need to define font styles in individual components.

## How to Use

### 1. Import the Hook
```typescript
import { useFonts } from '@/hooks/useFonts';
```

### 2. Use in Component
```typescript
const MyComponent = () => {
  const fonts = useFonts();
  
  return (
    <View>
      <Text style={fonts.headerLarge}>Main Title</Text>
      <Text style={fonts.subheaderMedium}>Section Title</Text>
      <Text style={fonts.bodyMedium}>Regular text content</Text>
    </View>
  );
};
```

## Available Font Styles

### Headers
- `fonts.headerLarge` - 24px, 900 weight, for main titles
- `fonts.headerMedium` - 20px, 800 weight, for section titles
- `fonts.headerSmall` - 18px, 700 weight, for subsection titles

### Subheaders
- `fonts.subheaderLarge` - 16px, 700 weight
- `fonts.subheaderMedium` - 15px, 600 weight
- `fonts.subheaderSmall` - 14px, 600 weight

### Body Text
- `fonts.bodyLarge` - 16px, 600 weight
- `fonts.bodyMedium` - 15px, 500 weight
- `fonts.bodySmall` - 14px, 500 weight

### Button Text
- `fonts.buttonLarge` - 17px, 800 weight
- `fonts.buttonMedium` - 15px, 700 weight
- `fonts.buttonSmall` - 13px, 600 weight

### Special (Amounts/Numbers)
- `fonts.amountLarge` - 44px, 900 weight, for large amounts
- `fonts.amountMedium` - 24px, 800 weight, for medium amounts
- `fonts.amountSmall` - 18px, 700 weight, for small amounts

### White Text (for dark backgrounds)
- `fonts.whiteLarge` - 20px, 900 weight, white color
- `fonts.whiteMedium` - 17px, 700 weight, white color
- `fonts.whiteSmall` - 15px, 600 weight, white color

### Grey Text
- `fonts.greyLarge` - 16px, 600 weight, grey color
- `fonts.greyMedium` - 15px, 500 weight, grey color
- `fonts.greySmall` - 14px, 500 weight, grey color

## Custom Colors
```typescript
// Use custom color with any font style
<Text style={fonts.withColor(fonts.headerMedium, '#FF0000')}>
  Red Header
</Text>
```

## Migration Examples

### Before (Old Way)
```typescript
const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.1)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
    fontFamily: 'System',
    lineHeight: 24,
  },
});

// Usage
<Text style={styles.title}>My Title</Text>
```

### After (New Way)
```typescript
const MyComponent = () => {
  const fonts = useFonts();
  
  return (
    <Text style={fonts.headerMedium}>My Title</Text>
  );
};
```

## Benefits
1. **Consistency** - All text follows the same design system
2. **Maintainability** - Change fonts globally from one place
3. **Less Code** - No need to define font styles in every component
4. **Type Safety** - TypeScript support for all font styles
5. **Easy Updates** - Modify the entire app's typography by updating one file

## Migration Steps
1. Import `useFonts` hook in your component
2. Replace existing font styles with the appropriate font style from the hook
3. Remove old font style definitions from StyleSheet
4. Test the component to ensure fonts look correct

## Next Steps
- Gradually migrate all components to use the global font system
- Remove individual font style definitions
- Update the Fonts.ts file to adjust typography globally if needed
