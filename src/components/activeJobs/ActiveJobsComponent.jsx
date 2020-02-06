import React, {useState} from 'react';
import {makeStyles} from "@material-ui/core";
import Typography from "@material-ui/core/Typography";
import {Map} from 'immutable';
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableCell from "@material-ui/core/TableCell";
import Table from "@material-ui/core/Table";
import TableBody from "@material-ui/core/TableBody";
import DoneIcon from '@material-ui/icons/Done';
import CircularProgress from '@material-ui/core/CircularProgress';

const {ipcRenderer} = require('electron');


const ActiveJobsComponent = (props) => {

    const styles = useStyles();

    const [jobs, setJobs] = useState(new Map());
    const [jobStatuses, setJobStatuses] = useState(new Map());

    ipcRenderer.on('newJobEvent', (event, args) => {
        setJobs(jobs.set(args.job.jobId, {...args.job, progress: 0}))
    });

    ipcRenderer.on('jobProgressEvent', (event, args) => {
        console.log('jobProgressEvent', args);
        setJobStatuses(jobs.set(args.job.jobId, args.progressEvent))
    });

    const ActiveJob = (props) => {
        const {job} = props;

        let jobStatus = jobStatuses.get(job.jobId) || {progress: 0, finished: false, result: null};

        return (
            <TableRow>
                <TableCell component="th" scope="row">
                    {job.jobId}
                </TableCell>
                <TableCell align="right">{jobStatus.finished ? <DoneIcon/> : <CircularProgress/>}</TableCell>
                <TableCell align="right">{jobStatus.result ? `${Math.floor(jobStatus.result * 100)}%` : ""}</TableCell>
            </TableRow>)
    };

    return (
        <div className={styles.root}>
            <Typography className={styles.heading} variant="h1" align="center">Active Jobs</Typography>

            <Table>
                <TableHead>
                    <TableRow>
                        <TableCell>Job</TableCell>
                        <TableCell align="right">Progress</TableCell>
                        <TableCell align="right">Similiariy Score</TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {jobs.toIndexedSeq().map((job, index) => <ActiveJob job={job} key={index}/>)}
                </TableBody>
            </Table>

        </div>
    );
};

const useStyles = makeStyles(() => ({
    root: {
        // display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
    },

    fileInputContainer: {
        width: '60%',
        float: 'left',
        alignItems: 'center',
        marginLeft: '5%'
    },

    heading: {
        fontSize: 20
    },

    networkList: {
        display: 'flex',
        spacing: '10%',
        alignItems: 'center',
        flexDirection: 'column',
        float: 'right',
        width: '30%'
    },
    button: {
        align: 'center'
    },

}));

export default ActiveJobsComponent;
