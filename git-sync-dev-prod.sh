#!/bin/bash

git push origin refs/heads/master:master

git checkout production
git rebase refs/heads/master
git push origin refs/heads/production:production

git checkout sand-slava
git rebase refs/heads/master
git push origin refs/heads/sand-slava:sand-slava

git checkout master

read -p "Press any key to resume ..."
