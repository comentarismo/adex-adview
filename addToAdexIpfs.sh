#!/usr/bin/env bash
USERNAME=$1
HOSTNAME=$2
SCRIPT='/home/data/adex-adview/addAndPinIpfs.sh'

# npm run-script build

rsync -av ./dist ${USERNAME}@${HOSTNAME}:/home/data/adex-adview
rsync -av --chmod=Du=rwx,Dg=rx,Do=rx,Fu=rwx,Fg=r,Fo=r ./addAndPinIpfs.sh ${USERNAME}@${HOSTNAME}:/home/data/adex-adview

ssh -l ${USERNAME} ${HOSTNAME} "${SCRIPT}"
