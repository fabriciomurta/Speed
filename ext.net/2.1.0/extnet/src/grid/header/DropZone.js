Ext.grid.header.DropZone.override({            
    onNodeDrop: function (node, dragZone, e, data) {
        if (this.valid) {
            var dragHeader   = data.header,
                dropLocation = data.dropLocation,
                targetHeader = dropLocation.header,
                fromCt       = dragHeader.ownerCt,
                localFromIdx = fromCt.items.indexOf(dragHeader), // Container.items is a MixedCollection
                toCt         = targetHeader.ownerCt,
                localToIdx   = toCt.items.indexOf(targetHeader),
                headerCt     = this.headerCt,
                fromIdx      = headerCt.getHeaderIndex(dragHeader),
                colsToMove   = dragHeader.isGroupHeader ? dragHeader.query(':not([isGroupHeader]):not([isComponentHeader])').length : 1,
                toIdx        = headerCt.getHeaderIndex(targetHeader),
                groupCt,
                scrollerOwner;

            // Drop position is to the right of the targetHeader, increment the toIdx correctly
            if (dropLocation.pos === 'after') {
                localToIdx++;
                toIdx += targetHeader.isGroupHeader ? targetHeader.query(':not([isGroupHeader]):not([isComponentHeader])').length : 1;
            }

            // If we are dragging in between two HeaderContainers that have had the lockable
            // mixin injected we will lock/unlock headers in between sections, and then continue
            // with another execution of onNodeDrop to ensure the header is dropped into the correct group
            if (data.isLock) {
                scrollerOwner = fromCt.up('[scrollerOwner]');
                scrollerOwner.lock(dragHeader, localToIdx);
                data.isLock = false;

                // Now that the header has been transferred into the correct HeaderContainer, recurse, and continue the drop operation with the same dragData
                this.onNodeDrop(node, dragZone, e, data);
            } else if (data.isUnlock) {
                scrollerOwner = fromCt.up('[scrollerOwner]');
                scrollerOwner.unlock(dragHeader, localToIdx);
                data.isUnlock = false;

                // Now that the header has been transferred into the correct HeaderContainer, recurse, and continue the drop operation with the same dragData
                this.onNodeDrop(node, dragZone, e, data);
            }
            
            // This is a drop within the same HeaderContainer.
            else {
                this.invalidateDrop();

                // Dragging within the same container.
                if ((fromCt === toCt) && (localToIdx > localFromIdx)) {
                    // A no-op. This can happen when cross lockable drag operations recurse (see above).
                    if (localToIdx === localFromIdx) {
                        return;
                    }
                    // If dragging rightwards, then after removal, the insertion index will be less.
                    if (localToIdx > localFromIdx) {
                        localToIdx -= 1;
                    }
                }

                // Suspend layouts while we sort all this out.
                Ext.suspendLayouts();

                // Remove dragged header from where it was.
                if (fromCt !== toCt) {
                    fromCt.remove(dragHeader, false);

                    // Dragged the last header out of the fromCt group... The fromCt group must die
                    if (fromCt.isGroupHeader) {
                        if (!fromCt.items.getCount()) {
                            groupCt = fromCt.ownerCt;
                            groupCt.remove(fromCt, false);
                            fromCt.el.dom.parentNode.removeChild(fromCt.el.dom);
                        }
                    }
                }

                // Move dragged header into its drop position
                if (fromCt === toCt) {
                    toCt.move(localFromIdx, localToIdx);
                } else {
                    toCt.insert(localToIdx, dragHeader);
                }

                // Group headers acquire the aggregate width of their child headers
                // Therefore a child header may not flex; it must contribute a fixed width.
                // But we restore the flex value when moving back into the main header container
                if (toCt.isGroupHeader) {
                    // Adjust the width of the "to" group header only if we dragged in from somewhere else.
                    if (toCt !== fromCt) {
                        dragHeader.savedFlex = dragHeader.flex;
                        delete dragHeader.flex;
                        dragHeader.width = dragHeader.getWidth();
                    }
                } else {
                    if (dragHeader.savedFlex) {
                        dragHeader.flex = dragHeader.savedFlex;
                        delete dragHeader.width;
                    }
                }

                // Refresh columns cache in case we remove an emptied group column
                headerCt.purgeCache();
                Ext.resumeLayouts(true);
                headerCt.onHeaderMoved(dragHeader, colsToMove, fromIdx, toIdx);

                // Emptied group header can only be destroyed after the header and grid have been refreshed
                if (!fromCt.items.getCount()) {
                    fromCt.destroy();
                }
            }
        }
    } 
});