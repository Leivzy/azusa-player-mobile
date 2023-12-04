import React, { useState, useEffect, useRef } from 'react';
import { View, BackHandler, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { IconButton } from 'react-native-paper';
import { useDebounce } from 'use-debounce';
import { useNetInfo } from '@react-native-community/netinfo';
import { useFocusEffect } from '@react-navigation/native';

import { styles } from '../../style';
import SongInfo from './SongInfo';
import SongBackground from './SongBackground';
import { useNoxSetting } from '@stores/useApp';
import SongMenu from './SongMenu';
import PlaylistInfo from '../Info/PlaylistInfo';
import PlaylistMenuButton from '../Menu/PlaylistMenuButton';
import { PLAYLIST_ENUMS, SearchRegex } from '@enums/Playlist';
import { syncFavlist } from '@utils/Bilibili/bilifavOperate';
import noxCache, { noxCacheKey } from '@utils/Cache';
import usePlayback from '@hooks/usePlayback';
import useTPControls from '@hooks/useTPControls';
import { reParseSearch as reParseSearchRaw } from '@utils/re';
import usePlaylist from '../usePlaylist';

const PlaylistList = () => {
  const currentPlayingList = useNoxSetting(state => state.currentPlayingList);
  const currentPlayingId = useNoxSetting(state => state.currentPlayingId);
  const setCurrentPlayingId = useNoxSetting(state => state.setCurrentPlayingId);
  const playerSetting = useNoxSetting(state => state.playerSetting);
  const playerStyle = useNoxSetting(state => state.playerStyle);
  const currentPlaylist = useNoxSetting(state => state.currentPlaylist);
  const {
    refreshPlaylist,
    refreshing,
    rows,
    setRows,
    selected,
    resetSelected,
    toggleSelected,
    toggleSelectedAll,
    shouldReRender,
    setShouldReRender,
  } = usePlaylist(currentPlaylist);
  const playlistShouldReRender = useNoxSetting(
    state => state.playlistShouldReRender
  );
  const setPlaylistSearchAutoFocus = useNoxSetting(
    state => state.setPlaylistSearchAutoFocus
  );
  const [checking, setChecking] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [debouncedSearchText] = useDebounce(searchText, 500);
  const playlistRef = useRef<FlashList<NoxMedia.Song>>(null);
  const netInfo = useNetInfo();
  // TODO: slow?
  const [cachedSongs, setCachedSongs] = useState<string[]>([]);
  const { playFromPlaylist } = usePlayback();
  const { preformFade } = useTPControls();

  const reParseSearch = (searchStr: string, rows: Array<NoxMedia.Song>) => {
    const extraReExtract = [
      {
        regex: SearchRegex.cachedMatch.regex,
        process: (val: RegExpExecArray, someRows: Array<NoxMedia.Song>) =>
          someRows.filter(row => cachedSongs.includes(noxCacheKey(row))),
      },
    ];
    return reParseSearchRaw({
      searchStr,
      rows,
      extraReExtract,
    });
  };

  const handleSearch = (searchedVal = '') => {
    if (searchedVal === '') {
      setRows(currentPlaylist.songList);
      return;
    }
    setRows(reParseSearch(searchedVal, currentPlaylist.songList));
  };

  /**
   * get a given song item/index combo used in flashlist's accurate index,
   * as currentRows may be at a filtered view and the index will not be reliable.
   * @param item
   * @param index
   * @returns
   */
  const getSongIndex = (item: NoxMedia.Song, index: number) => {
    return rows === currentPlaylist.songList
      ? index
      : currentPlaylist.songList.findIndex(row => row.id === item.id);
  };

  const searchAndEnableSearch = (val: string) => {
    setSearchText(val);
    setSearching(true);
  };

  const playSong = async (song: NoxMedia.Song) => {
    if (
      song.id === currentPlayingId &&
      currentPlaylist.id === currentPlayingList.id
    )
      return;
    // HACK: more responsive, so the current song banner will show
    // immediately instead of watiting for fade to complete
    // REVIEW: playfromplaylist also checks currentPlayingId. how is that possible?
    setCurrentPlayingId(song.id);
    const queuedSongList = playerSetting.keepSearchedSongListWhenPlaying
      ? rows
      : currentPlaylist.songList;
    const callback = () =>
      playFromPlaylist({
        playlist: { ...currentPlaylist, songList: queuedSongList },
        song,
      });
    if (song.id === currentPlayingId) {
      callback();
      return;
    }
    // REVIEW: ideally playFromPlaylist should accept an async function to wait
    // for it, but performFade is not exactly functional on android (it replies
    // on an event to emit) so we have to do conditionals outside of playFromPlaylist.
    preformFade(callback);
  };

  const scrollTo = (toIndex = -1) => {
    const currentIndex =
      toIndex < 0
        ? currentPlaylist.songList.findIndex(
            song => song.id === currentPlayingId
          )
        : toIndex;
    if (currentIndex > -1) {
      playlistRef.current?.scrollToIndex({
        index: currentIndex,
        viewPosition: 0.5,
      });
    }
  };

  /**
   * playlistShouldReRender is a global state that indicates playlist should be
   * refreshed. right now its only called when the playlist is updated in updatePlaylist.
   * this should in turn clear all searching, checking and filtering.
   */
  useEffect(() => {
    resetSelected();
    setChecking(false);
    setSearching(false);
    setRows(currentPlaylist.songList);
    setCachedSongs(Array.from(noxCache.noxMediaCache.cache.keys()));
  }, [currentPlaylist, playlistShouldReRender]);

  useEffect(() => {
    if (
      playerSetting.autoRSSUpdate &&
      currentPlaylist.type === PLAYLIST_ENUMS.TYPE_TYPICA_PLAYLIST &&
      currentPlaylist.subscribeUrl.length > 0 &&
      currentPlaylist.subscribeUrl[0].length > 0 &&
      new Date().getTime() - currentPlaylist.lastSubscribed > 86400000
    ) {
      refreshPlaylist().then(() => {
        if (currentPlaylist.biliSync) {
          syncFavlist(currentPlaylist);
        }
      });
    }
    if (playerSetting.dataSaver && netInfo.type === 'cellular') {
      searchAndEnableSearch(SearchRegex.cachedMatch.text);
      handleSearch(SearchRegex.cachedMatch.text);
      setPlaylistSearchAutoFocus(false);
    }
  }, [currentPlaylist]);

  useEffect(() => handleSearch(debouncedSearchText), [debouncedSearchText]);

  useEffect(() => {
    setShouldReRender(val => !val);
  }, [currentPlayingId, checking, playlistShouldReRender, netInfo.type]);

  useEffect(() => {
    if (!searching) {
      setSearchText('');
    }
  }, [searching]);

  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        if (checking) {
          setChecking(false);
          return true;
        }
        if (searching) {
          setSearching(false);
          return true;
        }
        return false;
      };

      const subscription = BackHandler.addEventListener(
        'hardwareBackPress',
        onBackPress
      );

      return () => subscription.remove();
    }, [checking, setChecking, searching, setSearching])
  );

  return (
    <View style={stylesLocal.mainContainer}>
      <View style={[styles.topBarContainer, { top: 10 }]}>
        <PlaylistInfo
          search={searching}
          searchText={searchText}
          setSearchText={setSearchText}
          onPressed={() => scrollTo()}
          selected={selected}
          checking={checking}
        />
        <View style={stylesLocal.container}>
          {checking && (
            <IconButton
              icon="select-all"
              onPress={toggleSelectedAll}
              size={25}
            />
          )}
          <IconButton
            icon="select"
            onPress={() => setChecking(val => !val)}
            size={25}
            containerColor={
              checking
                ? playerStyle.customColors.playlistDrawerBackgroundColor
                : undefined
            }
          />
          <IconButton
            icon="magnify"
            onPress={() => setSearching(val => !val)}
            size={25}
            mode={searching ? 'contained' : undefined}
            containerColor={
              searching
                ? playerStyle.customColors.playlistDrawerBackgroundColor
                : undefined
            }
          />
          <PlaylistMenuButton disabled={checking} />
        </View>
      </View>
      <View style={stylesLocal.playlistContainer}>
        <FlashList
          ref={playlistRef}
          data={rows}
          renderItem={({ item, index }) => (
            <SongBackground
              song={item}
              current={
                playerSetting.trackCoverArtCard && item.id === currentPlayingId
              }
            >
              <SongInfo
                item={item}
                index={index}
                currentPlaying={item.id === currentPlayingId}
                playSong={playSong}
                checking={checking}
                checkedList={selected}
                onChecked={() => toggleSelected(getSongIndex(item, index))}
                onLongPress={() => {
                  toggleSelected(getSongIndex(item, index));
                  setChecking(true);
                }}
                networkCellular={netInfo.type === 'cellular'}
              />
            </SongBackground>
            // </Animated.View>
          )}
          keyExtractor={(item, index) => `${item.id}.${index}`}
          estimatedItemSize={58}
          extraData={shouldReRender}
          onRefresh={refreshPlaylist}
          refreshing={refreshing}
        />
      </View>
      <SongMenu
        checking={checking}
        checked={selected}
        resetChecked={resetSelected}
        handleSearch={searchAndEnableSearch}
        prepareForLayoutAnimationRender={() =>
          playlistRef.current?.prepareForLayoutAnimationRender()
        }
      />
    </View>
  );
};
const stylesLocal = StyleSheet.create({
  container: {
    flexDirection: 'row',
    bottom: 5,
    justifyContent: 'flex-end',
  },
  mainContainer: { flex: 1 },
  playlistContainer: {
    ...styles.topBarContainer,
    flex: 4,
  },
  songInfoBackgroundImg: { opacity: 0.5 },
  songInfoBackgroundBanner: { flex: 1 },
});

export default PlaylistList;
