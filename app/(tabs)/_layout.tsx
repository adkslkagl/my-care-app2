import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="index"
        options={{ title: '홈', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="emotion"
        options={{ title: '😌 감정체크', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: '📋 기록', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="chat"
        options={{ title: '💬 AI상담', tabBarIcon: () => null }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '내 정보', tabBarIcon: () => null }}
      />
    </Tabs>
  );
}
