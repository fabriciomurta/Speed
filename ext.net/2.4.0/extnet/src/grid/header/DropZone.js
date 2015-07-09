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
                columnManager= headerCt.columnManager,
                fromIdx      = columnManager.getHeaderIndex(dragHeader),
                toIdx        = columnManager.getHeaderIndex(targetHeader),
                colsToMove   = dragHeader.isGroupHeader ? dragHeader.query(':not([isGroupHeader]):not([isComponentHeader])').length : 1,
                sameCt       = fromCt === toCt,
                scrollerOwner, savedWidth;


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
                // Cache the width here, we need to get it before we removed it from the DOM
                savedWidth = dragHeader.getWidth();

                // Dragging within the same container.
                if (sameCt) {
                    // A no-op. This can happen when cross lockable drag operations recurse (see above).
                    if (localToIdx === localFromIdx) {
                        headerCt.onHeaderMoved(dragHeader, colsToMove, fromIdx, toIdx);
                        return;
                    }
                    // If dragging rightwards, then after removal, the insertion index will be less.
                    if (localToIdx > localFromIdx) {
                        localToIdx -= 1;
                    }
                }

                // Suspend layouts while we sort all this out.
                Ext.suspendLayouts();

                if (sameCt) {
                    toCt.move(localFromIdx, localToIdx);
                } else {
                    fromCt.remove(dragHeader, false);
                    toCt.insert(localToIdx, dragHeader);
                }

                // Group headers acquire the aggregate width of their child headers
                // Therefore a child header may not flex; it must contribute a fixed width.
                // But we restore the flex value when moving back into the main header container
                if (toCt.isGroupHeader) {
                    // Adjust the width of the "to" group header only if we dragged in from somewhere else.
                    if (!sameCt) {
                        dragHeader.savedFlex = dragHeader.flex;
                        delete dragHeader.flex;
                        dragHeader.width = savedWidth;
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
            }
        }
    } 
});