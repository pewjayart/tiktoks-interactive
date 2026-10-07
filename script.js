(() => {
    const nameInput = document.querySelector("#nameInput");
    const historyList = document.querySelector("#historyList");
    const giftHistory = document.querySelector("#giftHistory");
    const socialHistory = document.querySelector("#socialHistory");
    const previewContent = document.querySelector("#previewContent");
    const portraitRecords = document.querySelector("#portraitRecords");
    const overlays = [...document.querySelectorAll(".overlay")];
    const toastRegion = document.querySelector("#toastRegion");
    const records = [];
    let selectedItem = null;
    let activeOverlay = null;
    let previousFocus = null;

    const timeZone = "Asia/Manila";
    const formatTime = (date) => new Intl.DateTimeFormat("en-PH", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone
    }).format(date);

    const updateClock = () => {
        const now = new Date();
        document.querySelector("#date").textContent = new Intl.DateTimeFormat("en-PH", {
            year: "numeric",
            month: "long",
            day: "numeric",
            weekday: "short",
            timeZone
        }).format(now);
        document.querySelector("#time").textContent = new Intl.DateTimeFormat("en-PH", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false,
            timeZone
        }).format(now);
    };

    const showToast = (message, kind = "success") => {
        const toast = document.createElement("div");
        toast.className = `toast${kind === "error" ? " error" : ""}`;
        const icon = document.createElement("i");
        icon.className = kind === "error" ? "fa-solid fa-circle-exclamation" : "fa-solid fa-circle-check";
        const text = document.createElement("span");
        text.textContent = message;
        toast.append(icon, text);
        toastRegion.append(toast);
        window.setTimeout(() => {
            toast.remove();
        }, 3200);
    };

    const openOverlay = (overlay) => {
        if (!overlay) return;
        previousFocus = document.activeElement;
        activeOverlay = overlay;
        overlay.classList.add("active");
        overlay.setAttribute("aria-hidden", "false");
        document.body.classList.add("modal-open");
        overlay.querySelector("button")?.focus();
    };

    const closeOverlay = (overlay = activeOverlay) => {
        if (!overlay) return;
        overlay.classList.remove("active");
        overlay.setAttribute("aria-hidden", "true");
        activeOverlay = null;
        document.body.classList.remove("modal-open");
        if (previousFocus instanceof HTMLElement) previousFocus.focus();
    };

    const makeImage = (source, alt, className) => {
        const image = document.createElement("img");
        image.src = source;
        image.alt = alt;
        image.className = className;
        return image;
    };

    const waitForImage = (image) => {
        if (image.complete) {
            return image.naturalWidth > 0
                ? Promise.resolve()
                : Promise.reject(new Error(`Could not load portrait image: ${image.src}`));
        }

        return new Promise((resolve, reject) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", () => {
                reject(new Error(`Could not load portrait image: ${image.src}`));
            }, { once: true });
        });
    };

    const updatePreview = () => {
        if (!selectedItem) {
            previewContent.innerHTML = '<div class="preview-empty"><span class="preview-hand"><i class="fa-solid fa-hand-pointer"></i></span><strong>Pick your next moment</strong><span>Your selected gift or action<br>will appear here.</span></div>';
            return;
        }

        const content = document.createElement("div");
        content.className = "preview-content";
        const imageBox = document.createElement("span");
        imageBox.className = "preview-image";
        imageBox.append(makeImage(selectedItem.image, selectedItem.name, selectedItem.type === "social" ? "social-icon-image" : ""));
        const title = document.createElement("strong");
        title.textContent = selectedItem.name;
        const subtitle = document.createElement("span");
        subtitle.textContent = selectedItem.type === "gift" ? "Ready to send this gift" : "Ready to record this social action";
        content.append(imageBox, title, subtitle);
        if (selectedItem.type === "gift") {
            const coins = document.createElement("span");
            coins.className = "preview-coins";
            const coinIcon = document.createElement("i");
            coinIcon.className = "fa-solid fa-coins";
            coins.append(coinIcon, document.createTextNode(` ${selectedItem.coins} ${selectedItem.coins === 1 ? "coin" : "coins"}`));
            content.append(coins);
        }
        previewContent.replaceChildren(content);
    };

    const makeSideEntry = (record) => {
        const entry = document.createElement("div");
        entry.className = "side-entry";
        entry.append(makeImage(record.image, "", record.type === "social" ? "social-activity-image" : ""));

        const copy = document.createElement("div");
        const name = document.createElement("strong");
        name.textContent = record.username;
        const detail = document.createElement("span");
        detail.textContent = record.type === "gift"
            ? `${record.name} · ${record.coins} ${record.coins === 1 ? "coin" : "coins"}`
            : record.name;
        copy.append(name, detail);
        entry.append(copy);
        return entry;
    };

    const renderRecords = () => {
        const emptyHistory = '<div class="empty-state"><span class="empty-icon"><i class="fa-regular fa-clock"></i></span><strong>No activity yet</strong><span>Enter a name, then choose a gift or social action.</span></div>';
        historyList.replaceChildren();
        if (records.length === 0) {
            historyList.innerHTML = emptyHistory;
        } else {
            for (const record of records) {
                const row = document.createElement("article");
                row.className = "history-item";
                const image = document.createElement("span");
                image.className = "history-item-image";
                image.append(makeImage(record.image, "", record.type === "social" ? "social-activity-image" : ""));

                const copy = document.createElement("span");
                copy.className = "history-item-copy";
                const title = document.createElement("strong");
                title.textContent = record.username;
                const description = document.createElement("span");
                description.textContent = record.type === "gift"
                    ? `Sent ${record.name} · ${record.coins} ${record.coins === 1 ? "coin" : "coins"}`
                    : `${record.name}ed`;
                if (record.name === "Subscribe") description.textContent = "Subscribed";
                copy.append(title, description);
                const time = document.createElement("time");
                time.dateTime = record.date.toISOString();
                time.textContent = formatTime(record.date);
                row.append(image, copy, time);
                historyList.append(row);
            }
        }

        const gifts = records.filter((record) => record.type === "gift");
        const socials = records.filter((record) => record.type === "social");
        giftHistory.replaceChildren(...(gifts.length
            ? gifts.map(makeSideEntry)
            : [makeEmptySide("No gifts yet", "fa-box-open")]));
        socialHistory.replaceChildren(...(socials.length
            ? socials.map(makeSideEntry)
            : [makeEmptySide("No actions yet", "fa-user-group")]));
        document.querySelector("#giftCount").textContent = String(gifts.length);
        document.querySelector("#socialCount").textContent = String(socials.length);
        document.querySelector("#activityCount").textContent = `${records.length} ${records.length === 1 ? "activity" : "activities"}`;
        renderPortraitRecords(gifts, socials);
    };

    const renderPortraitRecords = (gifts, socials) => {
        document.querySelector("#portraitGiftCount").textContent = String(gifts.length);
        document.querySelector("#portraitSocialCount").textContent = String(socials.length);
        portraitRecords.replaceChildren();

        for (const record of records) {
            const row = document.createElement("article");
            row.className = `portrait-record ${record.type === "gift" ? "portrait-gift-record" : "portrait-social-record"}`;
            const image = makeImage(record.image, "", "portrait-record-image");
            const details = document.createElement("div");
            details.className = "portrait-record-details";
            const username = document.createElement("strong");
            username.textContent = record.username;
            const description = document.createElement("span");
            description.textContent = record.type === "gift"
                ? `Sent ${record.name}`
                : record.name === "Follow" ? "Followed" : "Subscribed";
            details.append(username, description);

            const metadata = document.createElement("span");
            metadata.className = "portrait-record-meta";
            if (record.type === "gift") {
                const coinIcon = document.createElement("i");
                coinIcon.className = "fa-solid fa-coins";
                metadata.append(coinIcon, document.createTextNode(`${record.coins}`));
            } else {
                metadata.textContent = record.name;
            }

            const time = document.createElement("time");
            time.dateTime = record.date.toISOString();
            time.textContent = formatTime(record.date);
            row.append(image, details, metadata, time);
            portraitRecords.append(row);
        }
    };

    const makeEmptySide = (message, iconName) => {
        const empty = document.createElement("div");
        empty.className = "side-empty";
        const icon = document.createElement("i");
        icon.className = `fa-solid ${iconName}`;
        const text = document.createElement("span");
        text.textContent = message;
        empty.append(icon, text);
        return empty;
    };

    const setSelection = (button) => {
        selectedItem = {
            type: button.dataset.type,
            name: button.dataset.name,
            image: button.dataset.image,
            coins: Number(button.dataset.coins || 0)
        };
        document.querySelectorAll(".gift-choice, .social-choice").forEach((choice) => {
            choice.classList.toggle("selected", choice === button);
        });
        updatePreview();
        closeOverlay();
    };

    const recordSelection = () => {
        const username = nameInput.value.trim();
        if (!username) {
            showToast("Enter a username before recording an activity.", "error");
            nameInput.focus();
            return;
        }
        if (!selectedItem) {
            showToast("Choose a gift or social action first.", "error");
            return;
        }

        records.unshift({
            ...selectedItem,
            username,
            date: new Date()
        });
        renderRecords();
        showToast(`Recorded ${selectedItem.name} for ${username}.`);
    };

    const saveImage = async () => {
        if (records.length === 0) {
            showToast("Record at least one gift or social action before saving a portrait.", "error");
            return;
        }
        if (typeof window.html2canvas !== "function") {
            showToast("The image library could not load. Please reload the page.", "error");
            return;
        }

        const saveButton = document.querySelector("#portraitBtn");
        const filename = `pewjay-live-${Date.now()}.jpg`;

        if (saveButton.disabled) return;
        saveButton.disabled = true;

        try {
            const renderImage = async () => {
                const recordImages = [...portraitRecords.querySelectorAll("img")];
                await Promise.all([
                    document.fonts.ready,
                    ...recordImages.map(waitForImage)
                ]);
                const portraitCard = document.querySelector("#portraitCard");
                const bounds = portraitCard.getBoundingClientRect();
                const maxDimension = Math.max(bounds.width, bounds.height);
                const pixelCount = bounds.width * bounds.height;
                const scale = Math.min(2, 12000 / maxDimension, Math.sqrt(40000000 / pixelCount));
                const canvas = await window.html2canvas(portraitCard, {
                    backgroundColor: null,
                    scale,
                    useCORS: true
                });
                if (canvas.width === 0 || canvas.height === 0) {
                    throw new Error("The portrait has invalid image dimensions.");
                }
                const blob = await new Promise((resolve, reject) => {
                    canvas.toBlob((imageBlob) => {
                        if (imageBlob && imageBlob.size > 0) {
                            resolve(imageBlob);
                        } else {
                            reject(new Error("The portrait rendered as an empty image."));
                        }
                    }, "image/jpeg", .94);
                });
                if (blob.type !== "image/jpeg") {
                    throw new Error(`Expected a JPEG image but received ${blob.type || "an unknown format"}.`);
                }
                return blob;
            };

            if (typeof window.showSaveFilePicker === "function") {
                const saveHandlePromise = window.showSaveFilePicker({
                    suggestedName: filename,
                    types: [{
                        description: "JPEG image",
                        accept: { "image/jpeg": [".jpg", ".jpeg"] }
                    }]
                }).catch((error) => {
                    if (error.name === "AbortError") throw error;
                    console.warn("The Save As dialog is unavailable; using a browser download instead.", error);
                    return null;
                });
                const [fileHandle, blob] = await Promise.all([saveHandlePromise, renderImage()]);

                if (fileHandle) {
                    let writable;
                    try {
                        writable = await fileHandle.createWritable();
                        await writable.write(blob);
                        await writable.close();
                        showToast(`Image saved as ${fileHandle.name}.`);
                    } catch (error) {
                        console.warn("Saving through the file picker failed; starting a browser download instead.", error);
                        if (writable) {
                            try {
                                await writable.abort();
                            } catch (abortError) {
                                console.warn("Could not clean up the incomplete image file.", abortError);
                            }
                        }
                        downloadImage(blob, filename, "The Save As write failed. A JPG download has been started instead.");
                    }
                } else {
                    downloadImage(blob, filename);
                }
            } else {
                const blob = await renderImage();
                downloadImage(blob, filename);
            }
        } catch (error) {
            if (error.name === "AbortError") {
                showToast("Image save canceled.");
            } else {
                console.error("Failed to save image.", error);
                showToast(`Could not save the image: ${error.message || "Please try again."}`, "error");
            }
        } finally {
            saveButton.disabled = false;
        }
    };

    const downloadImage = (blob, filename, message = "Image download started. Check your downloads.") => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.append(link);
        link.click();
        window.setTimeout(() => {
            link.remove();
            URL.revokeObjectURL(url);
        }, 60000);
        showToast(message);
    };

    document.querySelector("#giftBtn").addEventListener("click", () => openOverlay(document.querySelector("#giftMenu")));
    document.querySelector("#socialBtn").addEventListener("click", () => openOverlay(document.querySelector("#socialMenu")));
    document.querySelector("#saveHistoryBtn").addEventListener("click", recordSelection);
    document.querySelector("#portraitBtn").addEventListener("click", saveImage);
    document.querySelector("#clearName").addEventListener("click", () => {
        nameInput.value = "";
        nameInput.focus();
    });
    document.querySelector("#clearHistory").addEventListener("click", () => {
        if (records.length === 0) {
            showToast("There is no activity history to clear.", "error");
            return;
        }
        records.length = 0;
        renderRecords();
        showToast("Activity history cleared.");
    });

    document.querySelectorAll(".gift-choice, .social-choice").forEach((button) => {
        button.addEventListener("click", () => setSelection(button));
    });
    document.querySelectorAll(".close-menu").forEach((button) => {
        button.addEventListener("click", () => closeOverlay(button.closest(".overlay")));
    });
    overlays.forEach((overlay) => {
        overlay.addEventListener("click", (event) => {
            if (event.target === overlay) closeOverlay(overlay);
        });
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && activeOverlay) closeOverlay();
        if (event.key === "Enter" && document.activeElement === nameInput) recordSelection();
    });

    updateClock();
    window.setInterval(updateClock, 1000);
    renderRecords();
})();
