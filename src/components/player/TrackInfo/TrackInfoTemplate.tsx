import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  Dimensions,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import type { Track } from 'react-native-track-player';
import Image from 'react-native-fast-image';

import { useNoxSetting } from '@hooks/useSetting';
import { getCurrentTPQueue } from '@stores/playingList';
import SongMenuButton from './SongMenuButton';
import FavReloadButton from './FavReloadButton';

interface Props {
  track?: Track;
  windowWidth?: number;
  onImagePress?: () => void;
  children?: React.JSX.Element;
}
const TrackInfoTemplate: React.FC<Props> = ({
  track,
  windowWidth,
  onImagePress = () => undefined,
  children,
}) => {
  const playerSetting = useNoxSetting(state => state.playerSetting);
  const playerStyle = useNoxSetting(state => state.playerStyle);
  const currentPlayingList = useNoxSetting(state => state.currentPlayingList);
  const dimension = Dimensions.get('window');
  const albumArtSize =
    windowWidth || Math.min(dimension.width, dimension.height);

  const getTrackLocation = () => {
    const currentTPQueue = getCurrentTPQueue();
    return track?.song
      ? `#${
          currentPlayingList.songList.findIndex(
            song => song.id === track.song.id
          ) + 1
        } - ${
          currentTPQueue.findIndex(song => song.id === track.song.id) + 1
        }/${currentTPQueue.length}`
      : '';
  };

  const AlbumArt = () => (
    <TouchableWithoutFeedback onPress={onImagePress}>
      <Animated.View style={styles.container}>
        <Image
          style={[
            styles.artwork,
            { width: albumArtSize, height: albumArtSize },
          ]}
          source={
            playerSetting.hideCoverInMobile
              ? 0
              : {
                  uri: `${track?.artwork}`,
                }
          }
        />
      </Animated.View>
    </TouchableWithoutFeedback>
  );

  return (
    <View style={styles.container}>
      {children || <AlbumArt />}
      <Text style={[styles.titleText, { color: playerStyle.colors.primary }]}>
        {track?.title}
      </Text>
      <View style={styles.infoContainer}>
        <View style={styles.favoriteButtonContainer}>
          <FavReloadButton track={track} />
        </View>
        <View style={styles.artistInfoContainer}>
          <Text
            style={[styles.artistText, { color: playerStyle.colors.secondary }]}
          >
            {track?.artist}
          </Text>
          <Text
            style={[styles.artistText, { color: playerStyle.colors.secondary }]}
          >
            {currentPlayingList.title}
          </Text>
          <Text
            style={[styles.artistText, { color: playerStyle.colors.secondary }]}
          >
            {getTrackLocation()}
          </Text>
        </View>
        <View style={styles.songMenuButtonContainer}>
          <SongMenuButton track={track} />
        </View>
      </View>
    </View>
  );
};

export default TrackInfoTemplate;

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  artwork: {
    opacity: 1,
  },
  lyric: {
    opacity: 1,
  },
  titleText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'grey',
    marginTop: 15,
    paddingHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artistText: {
    fontSize: 16,
    fontWeight: '200',
  },
  infoContainer: {
    flexDirection: 'row',
  },
  favoriteButtonContainer: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
  artistInfoContainer: {
    flex: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  songMenuButtonContainer: {
    flex: 1,
    // justifyContent: 'center',
    alignItems: 'center',
    marginTop: -10,
  },
});
