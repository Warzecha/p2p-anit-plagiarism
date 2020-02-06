import {makeStyles} from "@material-ui/core/styles";

const drawerWidth = 200;

const useMainStyle = makeStyles(theme => ({
    root: {
        display: 'flex',
    },

    appBar: {
        zIndex: theme.zIndex.drawer + 1,
    },

    menuButton: {
        marginRight: theme.spacing(2),
        [theme.breakpoints.up('sm')]: {
            display: 'none',
        },
    },

    drawer: {
        width: drawerWidth,
        flexShrink: 0,
    },

    drawerPaper: {
        width: drawerWidth,
    },

    content: {
        flexGrow: 1,
        padding: theme.spacing(3),
    },

}));

export default useMainStyle;
