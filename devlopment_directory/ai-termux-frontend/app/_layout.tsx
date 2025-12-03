// _layout.tsx
import { Stack } from 'expo-router';

export default function AppLayout() {
  return (
    <Stack>
      {/* This stack will manage navigation between your screens */}
      {/* We'll define specific screens here or in other files */}
      <Stack.Screen name="files" options={{ title: 'File Browser' }} />
      {/* Example for future screens: */}
      {/* <Stack.Screen name="editor" options={{ title: 'Code Editor' }} /> */}
      {/* <Stack.Screen name="ai-chat" options={{ title: 'AI Assistant' }} /> */}
    </Stack>
  );
}
