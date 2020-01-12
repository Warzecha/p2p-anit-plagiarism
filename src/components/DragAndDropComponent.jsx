import React, {useEffect, useRef, useState} from 'react';
import {makeStyles} from "@material-ui/core";
import classNames from 'classnames'
import Typography from "@material-ui/core/Typography";

const DragAndDropComponent = (props) => {
    const dropElement = useRef(null);

    const [isDragging, setIsDragging] = useState(false);
    const [dragCounter, setDragCounter] = useState(0);


    const styles = useStyles();

    useEffect(() => {


        let div = dropElement.current;
        div.addEventListener('dragenter', handleDragIn);
        div.addEventListener('dragleave', handleDragOut);
        div.addEventListener('drop', handleDrop);
        div.addEventListener('drag', preventEvent);
        div.addEventListener('dragenter', preventEvent);
        div.addEventListener('dragover', preventEvent);

        return () => {
            div.removeEventListener('dragenter', handleDragIn);
            div.removeEventListener('dragleave', handleDragOut);
            div.removeEventListener('drop', handleDrop);
            div.removeEventListener('drag', preventEvent);
            div.removeEventListener('dragenter', preventEvent);
            div.removeEventListener('dragover', preventEvent);
        }
    });


    const handleDragIn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragCounter(dragCounter + 1);
        if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
            setIsDragging(true)
        }
    };

    const preventEvent = (e) => {
        e.preventDefault();
        e.stopPropagation()
    };

    const handleDragOut = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragCounter <= 1) {
            setIsDragging(false)
        }
        setDragCounter(dragCounter - 1);
    };

    const handleDrop = (e) => {
        console.log('handleDrop');
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        setDragCounter(0);
        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            props.onFilesDropped(e.dataTransfer.files);
            e.dataTransfer.clearData()
        }
    };


    return (
        <div ref={dropElement} className={classNames(styles.root, {[styles.dragOver]: isDragging})}>
            <Typography className={styles.prompt}>Drag and drop files here</Typography>
        </div>
    );
};


const useStyles = makeStyles(() => ({

    root: {
        width: '100%',
        height: 100,
        border: '1px solid #ddd',
        borderRadius: 10,

        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'


    },

    prompt: {
        textAlign: 'center',
        fontSize: 24,
    },

    dragOver: {
        border: '2px solid blue',
    }

}));

export default DragAndDropComponent;