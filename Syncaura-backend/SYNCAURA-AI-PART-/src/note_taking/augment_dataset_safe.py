import pandas as pd

def safely_augment_dataset():
    """Safely add new examples to your existing clean dataset"""
    
    print("="*60)
    print("SAFE DATASET AUGMENTATION")
    print("="*60)
    
    # Step 1: Read your existing clean dataset
    print("\n[1/5] Reading existing dataset...")
    df_existing = pd.read_csv("new_dataset2_clean.csv")
    print(f"✓ Loaded {len(df_existing)} existing examples")
    print(f"  - Important: {len(df_existing[df_existing['label'] == 'important'])}")
    print(f"  - Not Important: {len(df_existing[df_existing['label'] == 'not_important'])}")
    
    # Step 2: Create backup
    print("\n[2/5] Creating backup...")
    df_existing.to_csv("new_dataset2_clean_BACKUP.csv", index=False)
    print("✓ Backup saved as 'new_dataset2_clean_BACKUP.csv'")
    
    # Step 3: Add new training examples
    print("\n[3/5] Preparing new examples...")
    
   
    new_important = [
        # Casual but important task assignments
        "so yeah we need this done by tomorrow",
        "umm the client expects results by friday",
        "okay so ravi will handle the testing part",
        "yeah priya should finish the design today",
        "so the deadline got moved to next week",
        "uhh we're allocating 40k for this module",
        "okay so the bug needs fixing asap",
        "yeah the feature must go live by monday",
        "so basically neha will review the code",
        "umm harsh is fixing that critical issue",
        
        # Technical but important
        "the api endpoint returns 500 errors",
        "database queries are timing out",
        "memory usage is at 95 percent",
        "the build pipeline is failing",
        "production server is down",
        "we're getting authentication errors",
        "the cache needs to be cleared",
        "response time exceeds 3 seconds",
        "users are reporting login failures",
        "payment processing is broken",
        
        # Implicit deadlines/priorities
        "this blocks the entire release",
        "without this we can't proceed",
        "this is blocking other tasks",
        "clients are waiting for this",
        "this affects all users",
        "we need approval before continuing",
        "legal team needs to review first",
        "stakeholders are asking for updates",
        
        # Budget/resource allocation (casual)
        "so we need like additional resources",
        "uhh the budget was approved yesterday",
        "yeah we're hiring two more developers",
        "umm server costs increased by 30 percent",
        
        # Action items with filler words
        "so like we should totally prioritize this",
        "yeah basically the entire flow needs redesign",
        "okay but seriously this needs attention now",
        "umm everyone please complete tasks by eod",
        "so yeah let's make sure this gets done",
        
        # Edge cases - short but important
        "critical bug found",
        "server crashed",
        "deploy today",
        "urgent client request",
        "production down",
        "release cancelled",
        "security breach detected",
        "data loss reported",
    ]
    
    # Additional NOT_IMPORTANT examples (edge cases)
    new_not_important = [
        # Longer filler statements
        "so yeah i was just thinking about this earlier",
        "umm okay so what i meant to say earlier was",
        "yeah no worries we can discuss this later maybe",
        "okay so i'm not really sure about this point",
        "hmm yeah that's an interesting perspective i guess",
        
        # Meta-conversation
        "can someone add me to the calendar invite",
        "who's taking notes for this meeting",
        "should we record this session",
        "what time does this meeting end",
        "do we have the zoom link for next time",
        "is this being recorded right now",
        "who scheduled this meeting",
        "can we change the recurring time",
        
        # Personal/casual
        "my coffee just arrived",
        "i need to step out for lunch soon",
        "it's pretty late here",
        "the weather is terrible today",
        "my cat just walked across the keyboard",
        "sorry i'm eating while talking",
        "i'm working from a cafe today",
        "my neighbor is being loud",
        
        # Vague statements
        "i think someone mentioned something about this",
        "wasn't there a discussion about this before",
        "maybe we should think about this more",
        "i'm not entirely sure to be honest",
        "that's just my opinion though",
        "we could potentially consider this",
        "i guess that might work",
        "perhaps we should revisit this",
        
        # Technical issues (longer)
        "yeah so my screen keeps freezing every few minutes",
        "i'm having trouble with my internet connection again",
        "the video quality is really poor on my end",
        "can everyone see my screen properly now",
        "my laptop battery is about to die",
        "switching to headphones give me a sec",
        
        # More casual filler
        "umm can someone hear that background noise",
        "oh wait my screen froze again",
        "yeah yeah just give me a moment",
        "okay i'll reconnect in a second",
        "uhh what was i talking about again",
        "yeah okay sure whatever works",
        "ummm i don't think this slide is loading",
    ]
    
    
    df_new_important = pd.DataFrame({
        'sentence': new_important,
        'label': 'important',
        'label_num': 1
    })
    
    df_new_not_important = pd.DataFrame({
        'sentence': new_not_important,
        'label': 'not_important',
        'label_num': 0
    })
    
    print(f"✓ Created {len(new_important)} new IMPORTANT examples")
    print(f"✓ Created {len(new_not_important)} new NOT_IMPORTANT examples")
    
    #Combine all data
    print("\n[4/5] Combining datasets...")
    df_augmented = pd.concat([
        df_existing,
        df_new_important,
        df_new_not_important
    ], ignore_index=True)
    
    # Remove duplicates 
    before_dedup = len(df_augmented)
    df_augmented = df_augmented.drop_duplicates(subset=['sentence'], keep='first')
    after_dedup = len(df_augmented)
    
    if before_dedup > after_dedup:
        print(f"✓ Removed {before_dedup - after_dedup} duplicate sentences")
    

    df_augmented = df_augmented.sample(frac=1, random_state=42).reset_index(drop=True)
    
    print("\n[5/5] Saving augmented dataset...")
    df_augmented.to_csv("new_dataset2_clean.csv", index=False)
    
 
    print("\n" + "="*60)
    print("AUGMENTATION COMPLETE!")
    print("="*60)
    print(f"\nOriginal dataset size: {len(df_existing)}")
    print(f"Augmented dataset size: {len(df_augmented)}")
    print(f"Added: {len(df_augmented) - len(df_existing)} new examples")
    
    print("\nFinal class distribution:")
    print(df_augmented['label'].value_counts())
    
    important_count = len(df_augmented[df_augmented['label'] == 'important'])
    not_important_count = len(df_augmented[df_augmented['label'] == 'not_important'])
    balance_ratio = min(important_count, not_important_count) / max(important_count, not_important_count)
    
    print(f"\nClass balance ratio: {balance_ratio:.2f}")
    if balance_ratio > 0.8:
        print("Dataset is well balanced!")
    else:
        print("Dataset has class imbalance (still okay, using class_weight='balanced')")
    
    print("\n Backup saved as: new_dataset2_clean_BACKUP.csv")
    print(" Augmented data saved as: new_dataset2_clean.csv")
    print("\nNext step: Run 'python train_model.py' to retrain!")

if __name__ == "__main__":
    safely_augment_dataset()