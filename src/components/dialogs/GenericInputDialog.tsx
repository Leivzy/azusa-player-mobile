import React, { useState } from 'react';
import { View, FlatList } from 'react-native';
import { Button, Dialog, TextInput } from 'react-native-paper';
import { useTranslation } from 'react-i18next';
import { logger } from '../../utils/Logger';
import { useNoxSetting } from '../../hooks/useSetting';

interface props {
  visible: boolean;
  options: Array<string>;
  title?: string;
  onClose?: (input: { [key: string]: string }) => void;
  onSubmit?: (input: { [key: string]: string }) => void;
}

const DialogTitle = ({ title }: { title: string | undefined }) => {
  if (!title) return <View></View>;
  return (
    <Dialog.Title style={{ maxHeight: 100 }}>
      {title.length > 20 ? title.substring(0, 20) + '...' : title}
    </Dialog.Title>
  );
};
/**
 * a generic dialog that displays a list of items in inputs
 */
export default ({
  visible,
  options,
  title = undefined,
  onClose = logger.debug,
  onSubmit = logger.debug,
}: props) => {
  const { t } = useTranslation();
  const playerStyle = useNoxSetting(state => state.playerStyle);
  const [currentInput, setCurrentInput] = useState<{
    [key: string]: string;
  }>({});

  const handleClose = () => {
    onClose(currentInput);
  };

  const handleSubmit = () => {
    onSubmit(currentInput);
  };

  React.useEffect(
    () =>
      setCurrentInput(
        options.reduce((acc, curr) => ({ ...acc, [curr]: '' }), {})
      ),
    [options]
  );

  return (
    <Dialog
      visible={visible}
      onDismiss={handleClose}
      style={{ maxHeight: '60%', minHeight: '50%' }}
    >
      <DialogTitle title={title} />
      <Dialog.Content style={{ flex: 1, minHeight: '20%' }}>
        <FlatList
          style={{ flex: 6 }}
          data={options}
          renderItem={({ item, index }) => (
            <TextInput
              label={item}
              value={currentInput[item]}
              onChange={e =>
                setCurrentInput({ ...currentInput, [item]: e.nativeEvent.text })
              }
              selectionColor={playerStyle.customColors.textInputSelectionColor}
              textColor={playerStyle.colors.text}
            />
          )}
        />
      </Dialog.Content>
      <Dialog.Actions style={{ maxHeight: 60, paddingBottom: 0 }}>
        <Button onPress={handleClose}>{t('Dialog.cancel')}</Button>
        <Button onPress={handleSubmit}>{t('Dialog.ok')}</Button>
      </Dialog.Actions>
    </Dialog>
  );
};
