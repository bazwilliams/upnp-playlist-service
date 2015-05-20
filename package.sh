#!/bin/bash

SYSROOT=deb-src/sysroot
TARGET_DIR=${SYSROOT}/opt/upnp-playlist-service
DEBIAN=deb-src/DEBIAN

BRANCH=${1}

GIT_COMMIT=`git ls-remote https://github.com/bazwilliams/upnp-playlist-service.git ${BRANCH} | cut -f 1`
TIMESTAMP=`date --utc +%FT%TZ`
PACKAGE_NAME="upnp-playlist-service"
PACKAGE_VERSION="0.0.1"

echo "*************************************"
echo "*"
echo "* Branch        : ${BRANCH}"
echo "* Git Commit    : ${GIT_COMMIT}"
echo "* Package Name  : ${PACKAGE_NAME}"
echo "* Package Ver   : ${PACKAGE_VERSION}"
echo "*"
echo "*************************************"

echo "Setup directories"
mkdir -p ${DEBIAN}
mkdir -p ${SYSROOT}
mkdir -p ${TARGET_DIR}
mkdir -p ${SYSROOT}/etc/init.d

# Get files for Deb file
echo "Packaging Template"
git archive --format=tar --remote=https://github.com/bazwilliams/upnp-playlist-service.git ${BRANCH} | tar --directory=${TARGET_DIR} -xf -

echo "Copying Cloud Exakt Populator Init Script"
git archive --format=tar --remote=https://github.com/bazwilliams/upnp-playlist-service.git ${BRANCH}:etc/init.d ds-service | tar --directory=${SYSROOT}/etc/init.d/ -xf -
chmod +x ${SYSROOT}/etc/init.d/upnp-playlist-service

echo "Create preinst file"
echo "if [ -e /etc/init.d/upnp-playlist-service ]" >> ${DEBIAN}/preinst
echo "then" >> ${DEBIAN}/preinst
echo "/etc/init.d/upnp-playlist-service stop" >> ${DEBIAN}/preinst
echo "fi" >> ${DEBIAN}/preinst

echo "Copy preinst file to prerm to stop service when uninstalling"
cp ${DEBIAN}/preinst ${DEBIAN}/prerm

echo "Make control file"
echo "Package: ${PACKAGE_NAME}" > ${DEBIAN}/control
echo "Version: ${PACKAGE_VERSION}" >> ${DEBIAN}/control
echo "Section: base" >> ${DEBIAN}/control
echo "Priority: optional" >> ${DEBIAN}/control
echo "Architecture: amd64" >> ${DEBIAN}/control
INSTALLED_SIZE=`du -s ${SYSROOT}`
echo "Installed-Size: ${INSTALLED_SIZE}" >> ${DEBIAN}/control
echo "Depends: nodejs (>= 0.12)" >> ${DEBIAN}/control
echo "Maintainer: Barry John Williams  <barry@bjw.me.uk>" >> ${DEBIAN}/control
echo "Description: Playlist and Alarm Function for Linn Ds and other Upnp compatible devices" >> ${DEBIAN}/control

echo "Creating deb package"
pushd deb-src

pushd sysroot/
tar czf ../data.tar.gz *
popd

pushd DEBIAN/
tar czf ../control.tar.gz *
popd

echo 2.0 > debian-binary
ar r ../upnp-playlist-service-${PACKAGE_VERSION}.deb debian-binary control.tar.gz data.tar.gz
popd