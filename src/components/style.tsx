import { StyleSheet } from 'react-native';
import noxTheme from './styles/nox';
import azusaTheme from './styles/azusa';
import { notNullDefault as nd } from '../utils/Utils';
import style from './styles/styleInterface';

export const createStyle = (customStyle: style) => {
  const refTheme = azusaTheme; // customStyle.lightTheme ? azusaTheme : noxTheme;
  return StyleSheet.create({
    screenContainer: {
      flex: 1,
      backgroundColor: nd(customStyle.screenBackgroundColor, refTheme.screenBackgroundColor),
      alignItems: 'center',
      justifyContent: 'center',
    },
    contentContainer: {
      flex: 6,
      alignItems: 'center',
    },
    topBarContainer: {
      width: '100%',
      flexDirection: 'row',
      // paddingHorizontal: 20,
      paddingLeft: 10,
      paddingRight: 5,
      justifyContent: 'flex-end',
      top: 4,
    },
    actionRowContainer: {
      flexDirection: 'column',
      width: '96%',
      paddingLeft: 5,
      paddingright: 5,
      left: '2%',
      alignItems: 'center',
      height: 140,
    },
    playlistDrawer: {
      backgroundColor: nd(customStyle.playlistDrawerBackgroundColor, refTheme.playlistDrawerBackgroundColor),
    }
  });
  
}

export const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    flex: 6,
    alignItems: 'center',
  },
  topBarContainer: {
    width: '100%',
    flexDirection: 'row',
    // paddingHorizontal: 20,
    paddingLeft: 10,
    paddingRight: 5,
    justifyContent: 'flex-end',
    top: 4,
  },
  actionRowContainer: {
    flexDirection: 'column',
    width: '96%',
    paddingLeft: 5,
    paddingright: 5,
    left: '2%',
    alignItems: 'center',
    height: 140,
  },
});
