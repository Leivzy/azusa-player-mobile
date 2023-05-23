import React, { ReactNode, useRef, useState } from 'react';
import { DrawerItem, DrawerItemList } from '@react-navigation/drawer';
import { IconButton, Divider, Text, TouchableRipple } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { Pressable, Dimensions, View } from 'react-native';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';

import { useNoxSetting } from '../../hooks/useSetting';
import { ViewEnum } from '../../enums/View';
import AddPlaylistButton from '../buttons/AddPlaylistButton';
import { STORAGE_KEYS } from '../../utils/ChromeStorage';
import NewPlaylistDialog from '../dialogs/NewPlaylistDialog';
import useAlert from '../dialogs/useAlert';

export default (props: any) => {
  const navigation = useNavigation();
  const currentPlayingList = useNoxSetting(state => state.currentPlayingList);
  const currentPlaylist = useNoxSetting(state => state.currentPlaylist);
  const playlists = useNoxSetting(state => state.playlists);
  const playlistIds = useNoxSetting(state => state.playlistIds);
  const playerStyle = useNoxSetting(state => state.playerStyle);
  const playerSetting = useNoxSetting(state => state.playerSetting);
  // TODO: and how to property type this?
  const addPlaylistButtonRef = useRef<any>(null);
  const setCurrentPlaylist = useNoxSetting(state => state.setCurrentPlaylist);
  const removePlaylist = useNoxSetting(state => state.removePlaylist);
  const setPlaylistIds = useNoxSetting(state => state.setPlaylistIds);
  const { TwoWayAlert } = useAlert();

  // HACK: tried to make searchList draweritem button as addPlaylistButton, but
  // dialog disposes on textinput focus. created a dialog directly in this component
  // instead and works fine.
  const [newPlaylistDialogOpen, setNewPlaylistDialogOpen] = useState(false);

  const goToPlaylist = (playlistId: string) => {
    setCurrentPlaylist(playlists[playlistId]);
    navigation.navigate(ViewEnum.PLAYER_PLAYLIST as never);
  };

  const confirmOnDelete = (playlistId: string) => {
    TwoWayAlert(
      `Delete ${playlists[playlistId].title}?`,
      `Are you sure to delete playlist ${playlists[playlistId].title}?`,
      () => removePlaylist(playlistId)
    );
  };

  const renderPlaylistWrapper = ({
    item,
    icon,
  }: {
    item: NoxMedia.Playlist;
    icon?: ReactNode;
  }) => {
    const defaultIcon = (item: NoxMedia.Playlist) => (
      <IconButton
        icon="close"
        onPress={() => confirmOnDelete(item.id)}
        size={25}
      />
    );

    if (!item) return <></>;
    return (
      <View style={{ flexDirection: 'row' }}>
        <View style={{ flex: 4, justifyContent: 'center' }}>
          <Text
            variant="bodyLarge"
            style={{
              fontWeight:
                currentPlayingList.id === item.id ? 'bold' : undefined,
            }}
          >
            {item.title}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          {icon ? icon : defaultIcon(item)}
        </View>
      </View>
    );
  };

  const searchPlaylistAsNewButton = () => (
    <Pressable onPress={() => setNewPlaylistDialogOpen(true)} hitSlop={40}>
      <IconButton icon="new-box" size={25} />
    </Pressable>
  );

  const renderItem = ({
    item,
    drag,
    isActive,
  }: RenderItemParams<NoxMedia.Playlist>) => {
    return (
      <ScaleDecorator>
        <TouchableRipple
          onLongPress={drag}
          disabled={isActive}
          onPress={() => goToPlaylist(item.id)}
          style={{
            paddingLeft: 25,
            backgroundColor:
              currentPlaylist.id === item.id
                ? playerStyle.customColors.playlistDrawerBackgroundColor
                : undefined,
            borderRadius: 40,
          }}
        >
          {renderPlaylistWrapper({ item })}
        </TouchableRipple>
      </ScaleDecorator>
    );
  };

  // TODO: you dont have to use draweritem. you can use a typical list.
  // then convert this to a dnd list!!!
  return (
    <View {...props}>
      <DrawerItemList {...props} />
      <Divider></Divider>
      <DrawerItem
        label=""
        icon={() => <AddPlaylistButton ref={addPlaylistButtonRef} />}
        onPress={
          // HACK: tooo lazy to lift this state up...
          addPlaylistButtonRef.current
            ? () => addPlaylistButtonRef.current!.setOpen()
            : () => void 0
        }
      />
      <TouchableRipple
        onPress={() => goToPlaylist(STORAGE_KEYS.SEARCH_PLAYLIST_KEY)}
        style={{
          paddingLeft: 25,
          backgroundColor:
            currentPlaylist.id ===
            playlists[STORAGE_KEYS.SEARCH_PLAYLIST_KEY]?.id
              ? playerStyle.customColors.playlistDrawerBackgroundColor
              : undefined,
          borderRadius: 40,
        }}
      >
        {renderPlaylistWrapper({
          item: playlists[STORAGE_KEYS.SEARCH_PLAYLIST_KEY],
          icon: searchPlaylistAsNewButton(),
        })}
      </TouchableRipple>
      <NewPlaylistDialog
        visible={newPlaylistDialogOpen}
        fromList={playlists[STORAGE_KEYS.SEARCH_PLAYLIST_KEY]}
        onClose={() => setNewPlaylistDialogOpen(false)}
        onSubmit={() => setNewPlaylistDialogOpen(false)}
      />
      <DraggableFlatList
        style={{
          // HACK: i dont know what to do at this point
          maxHeight: Dimensions.get('window').height - 300,
        }}
        data={playlistIds.map(val => playlists[val])}
        // TODO: very retarded, but what?
        onDragEnd={({ data }) =>
          setPlaylistIds(data.map(playlist => playlist.id))
        }
        keyExtractor={item => item.id}
        renderItem={renderItem}
      />
      <View>
        <Text style={{ textAlign: 'center', paddingBottom: 20 }}>
          {`${playerStyle.metaData.themeName} @ ${playerSetting.noxVersion}`}
        </Text>
      </View>
    </View>
  );
};
