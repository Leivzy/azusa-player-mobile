import Snackbar from 'react-native-snackbar';
import { useTranslation } from 'react-i18next';

import { useNoxSetting } from '@stores/useApp';
import usePlaylistCRUD from './usePlaylistCRUD';
import useAlert from '@components/dialogs/useAlert';
import usePlaylistAA from './usePlaylistAA';

interface Props {
  callback?: () => void;
}
export default ({ callback = () => {} }: Props) => {
  const { t } = useTranslation();
  const currentPlaylist = useNoxSetting(state => state.currentPlaylist);
  const {
    playlistAnalyze,
    playlistCleanup,
    playlistBiliShazam,
    playlistReload,
    playlistClear,
    playlistSync2Bilibili,
  } = usePlaylistCRUD();
  const { removePlaylist } = usePlaylistAA();
  const { OneWayAlert, TwoWayAlert } = useAlert();

  const playlistSync2BilibiliRN = async (playlist = currentPlaylist) => {
    Snackbar.show({
      text: t('PlaylistOperations.bilisyncing', { playlist }),
      duration: Snackbar.LENGTH_INDEFINITE,
    });
    await playlistSync2Bilibili(playlist);
    Snackbar.dismiss();
    Snackbar.show({ text: t('PlaylistOperations.bilisynced', { playlist }) });
  };

  const playlistAnalysis = (playlist = currentPlaylist) => {
    const analytics = playlistAnalyze(playlist, 5);
    OneWayAlert(analytics.title, analytics.content.join('\n'), callback);
  };

  const confirmOnPlaylistClear = (playlist = currentPlaylist) => {
    TwoWayAlert(
      t('PlaylistOperations.clearListTitle', { playlist }),
      t('PlaylistOperations.clearListMsg', { playlist }),
      () => {
        playlistClear(playlist);
        callback();
      }
    );
  };

  const confirmOnPlaylistDelete = (playlist = currentPlaylist) => {
    TwoWayAlert(
      t('PlaylistOperations.deleteListTitle', { playlist }),
      t('PlaylistOperations.deleteListMsg', { playlist }),
      () => {
        removePlaylist(playlist.id);
        callback();
      }
    );
  };

  const confirmOnPlaylistReload = (playlist = currentPlaylist) => {
    TwoWayAlert(
      t('PlaylistOperations.resetListTitle', { playlist }),
      t('PlaylistOperations.resetListMsg', { playlist }),
      async () => {
        Snackbar.show({
          text: t('PlaylistOperations.reloading', { playlist }),
          duration: Snackbar.LENGTH_INDEFINITE,
        });
        await playlistReload(playlist);
        Snackbar.dismiss();
        Snackbar.show({ text: t('PlaylistOperations.reloaded', { playlist }) });
        callback();
      }
    );
  };

  const playlistCleanupRN = async (playlist = currentPlaylist) => {
    Snackbar.show({
      text: t('PlaylistOperations.cleaning', { playlist }),
      duration: Snackbar.LENGTH_INDEFINITE,
    });
    await playlistCleanup(playlist);
    Snackbar.dismiss();
    Snackbar.show({ text: t('PlaylistOperations.cleaned', { playlist }) });
  };

  const playlistBiliShazamRN = async (playlist = currentPlaylist) => {
    Snackbar.show({
      text: t('PlaylistOperations.bilishazaming', { playlist }),
      duration: Snackbar.LENGTH_INDEFINITE,
    });
    await playlistBiliShazam(playlist);
    Snackbar.dismiss();
    Snackbar.show({ text: t('PlaylistOperations.bilishazamed', { playlist }) });
  };
  return {
    playlistSync2BilibiliRN,
    playlistAnalysis,
    confirmOnPlaylistClear,
    confirmOnPlaylistDelete,
    confirmOnPlaylistReload,
    playlistCleanupRN,
    playlistBiliShazamRN,
  };
};