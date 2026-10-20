import { StyleSheet, View } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { Button } from '@/components/ui/button';
import { Spacing } from '@/constants/theme';
import { messageForError } from '@/shared/api';

interface Props {
  error: unknown;
  onRetry: () => void;
  retrying?: boolean;
}

/** Full-area error placeholder with a retry button. Reuses the shared
 *  `messageForError` mapping so copy matches the global error toasts. */
export function ErrorState({ error, onRetry, retrying }: Props) {
  return (
    <View style={styles.container}>
      <ThemedText type="smallBold">Couldn’t load data</ThemedText>
      <ThemedText type="small" themeColor="textSecondary" style={styles.message}>
        {messageForError(error)}
      </ThemedText>
      <Button title="Try again" onPress={onRetry} loading={retrying} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.four,
  },
  message: {
    textAlign: 'center',
  },
});
