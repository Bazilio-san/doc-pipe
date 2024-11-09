#!/bin/bash

#=============== Обновление версии перед комитом: minor + 1 ==========================

#File: .git/hooks/pre-commit
# Version 2020-08-22

c='\033[0;35m'
y='\033[0;33m'
c0='\033[0;0m'
g='\033[0;32m'
set -e

get_version(){
  old_version=`cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]'`
}

update_version(){
    old_version=`cat package.json | grep version | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]'`
    echo -e "$c**** Old version is $g$old_version$c ****$c0"
    version_split=( ${old_version//./ } )
    major=${version_split[0]:-0}
    minor=${version_split[1]:-0}
    patch=${version_split[2]:-0}
    let "patch=patch+1"
    new_version="${major}.${minor}.${patch}"

    repo=`cat package.json | grep name | head -1 | awk -F: '{ print $2 }' | sed 's/[\",]//g' | tr -d '[[:space:]]'`
    echo -e "$c**** Bumping version of $g$repo$c: $y$old_version$c -> $g$new_version$c  ****$c0"
    sed -i -e "0,/$old_version/s/$old_version/$new_version/" package.json
    echo -e "$g"
    npm version 2>&1 | head -2 | tail -1
    echo -e "$c0"
}

get_version

git add --all
git commit -m "$old_version" --no-verify
git push

read -p "Press any key to resume ..."

#git add --all && git commit -m "1" --no-verify && git push
