import React from 'react';
import ListItem from "@material-ui/core/ListItem";
import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import ListItemSecondaryAction from "@material-ui/core/ListItemSecondaryAction";
import IconButton from "@material-ui/core/IconButton";
import FileIcon from '@material-ui/icons/DescriptionOutlined';
import DeleteIcon from '@material-ui/icons/Delete';
import List from "@material-ui/core/List";
import {makeStyles} from "@material-ui/core";

const FileListComponent = (props) => {

    const styles = useStyles();

    const {files} = props;

    const getFileList = () => files.toIndexedSeq().map((file, index) => (
        <ListItem key={index}>
            <ListItemIcon>
                <FileIcon/>
            </ListItemIcon>
            <ListItemText primary={file.name}/>

            <ListItemSecondaryAction>
                <IconButton edge="end" aria-label="delete"
                            onClick={() => props.onFileDeleted(file)}
                >
                    <DeleteIcon />
                </IconButton>
            </ListItemSecondaryAction>
        </ListItem>));

    return (
        <div className={styles.root}>
            <List>
                {getFileList()}
            </List>
        </div>
    );
};

const useStyles = makeStyles(() => ({

    root: {
        width: '100%',
    },

}));

export default FileListComponent;